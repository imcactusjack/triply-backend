import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { IPlacesClient, PlaceCoordinates } from './interface/places.client';

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

  async getPlaceCoordinates(query: string): Promise<PlaceCoordinates | null> {
    if (!query || query.trim() === '') {
      this.logger.warn(`[PLACES] 빈 쿼리: ${query}`);
      return null;
    }

    try {
      this.logger.log(`[PLACES] 장소 검색 시작: ${query}`);

      // Text Search API를 사용하여 장소 검색
      const url = `${this.baseUrl}/findplacefromtext/json`;
      const params = {
        input: query,
        inputtype: 'textquery',
        fields: 'geometry/location',
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

      // 응답 상태 확인
      if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.geometry?.location) {
          const coordinates: PlaceCoordinates = {
            latitude: candidate.geometry.location.lat,
            longitude: candidate.geometry.location.lng,
          };
          this.logger.log(`[PLACES] 좌표 조회 성공: ${query} -> (${coordinates.latitude}, ${coordinates.longitude})`);
          return coordinates;
        }
      }

      // 결과가 없거나 상태가 OK가 아닌 경우
      this.logger.warn(`[PLACES] 장소를 찾을 수 없음: ${query}, Status: ${data.status}`);
      return null;
    } catch (error) {
      this.logger.error(`[PLACES] 장소 검색 중 오류 발생: ${error.message}`);
      this.logger.error(`[PLACES] Query: ${query}`);
      return null;
    }
  }
}
