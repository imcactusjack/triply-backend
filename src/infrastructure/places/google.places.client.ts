import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { IPlacesClient, PlaceCoordinate, PlaceDetail } from './interface/places.client';

@Injectable()
export class GooglePlacesClient implements IPlacesClient {
  private readonly logger = new Logger('GOOGLE_PLACES');
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('GOOGLE_MAPS_PLATFORM_KEY');
  }

  async getPlaceCoordinates(query: string): Promise<PlaceCoordinate | null> {
    const details = await this.getPlaceDetails(query);
    if (!details) {
      return null;
    }
    return {
      latitude: details.latitude,
      longitude: details.longitude,
    };
  }

  async getPlaceDetails(query: string): Promise<PlaceDetail | null> {
    if (!query || query.trim() === '') {
      this.logger.warn(`[PLACES] 빈 쿼리: ${query}`);
      return null;
    }

    try {
      this.logger.log(`[PLACES] 장소 검색 시작: ${query}`);

      // 1) Find Place From Text
      const url = `${this.baseUrl}/findplacefromtext/json`;
      const params = {
        input: query,
        inputtype: 'textquery',
        language: 'ko',
        region: 'kr',
        fields:
          'place_id,name,geometry/location,rating,user_ratings_total,opening_hours/weekday_text,formatted_address',
        key: this.apiKey,
      };

      const { data } = await firstValueFrom(
        this.httpService.get(url, { params }).pipe(
          catchError((error: AxiosError) => {
            const errorMessage = error.message || '알 수 없는 오류';
            this.logger.error(`[PLACES] API 호출 실패: ${errorMessage}`);
            this.logger.error(`[PLACES] Query: ${query}`);
            return Promise.resolve({ data: { candidates: [], status: 'ERROR' } });
          }),
        ),
      );

      if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        const placeId = candidate.place_id;
        const directDetail = this.mapCandidateToDetails(candidate, query);
        const placeDetail =
          placeId != null ? await this.fetchPlaceDetailsById(placeId, query, directDetail) : directDetail;
        if (placeDetail) {
          return placeDetail;
        }
      }

      if (data.status && data.status !== 'OK') {
        this.logger.warn(
          `[PLACES] 1차 FindPlace 실패: ${query}, Status: ${data.status}, message: ${data.error_message || ''}`,
        );
      }

      // 2) Fallback: Text Search API
      const textSearchUrl = `${this.baseUrl}/textsearch/json`;
      const textSearchParams = {
        query,
        language: 'ko',
        region: 'kr',
        key: this.apiKey,
      };

      const { data: textData } = await firstValueFrom(
        this.httpService.get(textSearchUrl, { params: textSearchParams }).pipe(
          catchError((error: AxiosError) => {
            const errorMessage = error.message ? error.message : '알 수 없는 오류';
            this.logger.error(`[PLACES] TextSearch API 호출 실패: ${errorMessage}`);
            this.logger.error(`[PLACES] Query: ${query}`);
            return Promise.resolve({ data: { results: [], status: 'ERROR' } });
          }),
        ),
      );

      if (textData.status === 'OK' && textData.results && textData.results.length > 0) {
        const candidate = textData.results[0];
        const directDetail = this.mapTextSearchToDetails(candidate, query);
        const placeDetail =
          candidate.place_id != null
            ? await this.fetchPlaceDetailsById(candidate.place_id, query, directDetail)
            : directDetail;
        if (placeDetail) {
          this.logger.log(
            `[PLACES] TextSearch 성공: ${query} -> (${placeDetail.latitude}, ${placeDetail.longitude}), rating=${placeDetail.rating}`,
          );

          return placeDetail;
        }
      }

      this.logger.warn(
        `[PLACES] 장소를 찾을 수 없음 (모든 시도 실패): ${query}, Status: ${textData.status}, message: ${
          textData.error_message || ''
        }`,
      );
      return null;
    } catch (error) {
      this.logger.error(`[PLACES] 장소 검색 중 오류 발생: ${error.message}`);
      this.logger.error(`[PLACES] Query: ${query}`);
      return null;
    }
  }

  private mapCandidateToDetails(candidate: any, query: string): PlaceDetail | null {
    if (!candidate?.geometry?.location) {
      this.logger.warn(`[PLACES] geometry 없음: ${query}`);
      return null;
    }

    const placeDetail: PlaceDetail = {
      latitude: candidate.geometry.location.lat,
      longitude: candidate.geometry.location.lng,
      rating: candidate.rating,
      userRatingsTotal: candidate.user_ratings_total,
      openingHoursText: candidate.opening_hours?.weekday_text || candidate.current_opening_hours?.weekday_text,
      openingNow: candidate.opening_hours?.open_now ?? candidate.current_opening_hours?.open_now,
      placeId: candidate.place_id,
      formattedAddress: candidate.formatted_address,
    };

    this.logger.log(
      `[PLACES] 상세 조회 성공: ${query} -> (${placeDetail.latitude}, ${placeDetail.longitude}), rating=${placeDetail.rating}`,
    );
    return placeDetail;
  }

  private mapTextSearchToDetails(result: any, query: string): PlaceDetail | null {
    const geometry = result?.geometry?.location;
    if (!geometry) {
      this.logger.warn(`[PLACES] TextSearch geometry 없음: ${query}`);
      return null;
    }

    return {
      latitude: geometry.lat,
      longitude: geometry.lng,
      rating: result.rating,
      userRatingsTotal: result.user_ratings_total,
      openingHoursText: result.opening_hours?.weekday_text || result.current_opening_hours?.weekday_text,
      openingNow: result.opening_hours?.open_now ?? result.current_opening_hours?.open_now,
      placeId: result.place_id,
      formattedAddress: result.formatted_address,
    };
  }

  private async fetchPlaceDetailsById(
    placeId: string,
    query: string,
    fallback?: PlaceDetail | null,
  ): Promise<PlaceDetail | null> {
    try {
      const url = `${this.baseUrl}/details/json`;
      const params = {
        place_id: placeId,
        language: 'ko',
        region: 'kr',
        fields:
          'geometry/location,rating,user_ratings_total,opening_hours/weekday_text,opening_hours/open_now,formatted_address,place_id',
        key: this.apiKey,
      };

      const { data } = await firstValueFrom(
        this.httpService.get(url, { params }).pipe(
          catchError((error: AxiosError) => {
            const errorMessage = error.message || '알 수 없는 오류';
            this.logger.error(`[PLACES] Details API 호출 실패: ${errorMessage}`);
            this.logger.error(`[PLACES] placeId: ${placeId}, Query: ${query}`);
            return Promise.resolve({ data: { result: null, status: 'ERROR' } });
          }),
        ),
      );

      if (data.status === 'OK' && data.result?.geometry?.location) {
        const location = data.result.geometry.location;
        const placeDetail: PlaceDetail = {
          latitude: location.lat,
          longitude: location.lng,
          rating: data.result.rating ?? fallback?.rating,
          userRatingsTotal: data.result.user_ratings_total ?? fallback?.userRatingsTotal,
          openingHoursText:
            data.result.opening_hours?.weekday_text ||
            data.result.current_opening_hours?.weekday_text ||
            fallback?.openingHoursText,
          openingNow:
            data.result.opening_hours?.open_now ?? data.result.current_opening_hours?.open_now ?? fallback?.openingNow,
          placeId: data.result.place_id ?? fallback?.placeId ?? placeId,
          formattedAddress: data.result.formatted_address ?? fallback?.formattedAddress,
        };

        this.logger.log(
          `[PLACES] Details 성공: ${query} -> (${placeDetail.latitude}, ${placeDetail.longitude}), rating=${placeDetail.rating}`,
        );
        return placeDetail;
      }

      this.logger.warn(
        `[PLACES] Details 결과 없음: placeId=${placeId}, query=${query}, status=${data.status}, message=${
          data.error_message || ''
        }`,
      );
      return fallback ?? null;
    } catch (error) {
      this.logger.error(`[PLACES] Details 조회 중 오류: ${error.message}`);
      this.logger.error(`[PLACES] placeId: ${placeId}, Query: ${query}`);
      return fallback ?? null;
    }
  }
}
