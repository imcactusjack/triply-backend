import { Inject, Injectable, Logger } from '@nestjs/common';
import { LLMClient, TravelPlanLLMInput } from '../../infrastructure/llm/interface/llm.client';
import { IPlacesClient } from '../../infrastructure/places/interface/places.client';
import { ScheduleRecommendReqDto } from '../api/schedule.req.dto';
import { ScheduleRecommendResDto } from '../api/schedule.res.dto';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger('ScheduleService');

  constructor(
    @Inject('ILlmClient') private llmClient: LLMClient,
    @Inject('IPlacesClient') private placesClient: IPlacesClient,
  ) {}

  async recommendSchedule(request: ScheduleRecommendReqDto): Promise<ScheduleRecommendResDto> {
    const llmInput: TravelPlanLLMInput = {
      departure: request.departure,
      destination: request.destination,
      companions: request.companions,
      dates: {
        startDate: request.dates.startDate,
        endDate: request.dates.endDate,
      },
      concepts: request.concepts,
      preferences: request.preferences,
    };

    // 1. LLM으로 여행 일정 생성
    const result = await this.llmClient.generateTravelPlan(llmInput);

    // 2. 각 활동의 좌표 정보 채우기
    this.logger.log('좌표 정보 채우기 시작...');
    const scheduleWithCoordinates = await Promise.all(
      result.schedule.map(async (dayPlan) => {
        const activitiesWithCoordinates = await Promise.all(
          dayPlan.activities.map(async (activity) => {
            // 좌표가 이미 있거나 null이 아닌 경우 그대로 사용
            if (
              activity.coordinates &&
              activity.coordinates.latitude !== null &&
              activity.coordinates.longitude !== null
            ) {
              return activity;
            }

            // placeSearchQuery가 있으면 Google Places API로 좌표 조회
            if (activity.placeSearchQuery) {
              const coordinates = await this.placesClient.getPlaceCoordinates(activity.placeSearchQuery);
              if (coordinates) {
                return {
                  ...activity,
                  coordinates: {
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                  },
                };
              }
            }

            // 좌표를 찾지 못한 경우 null 좌표 유지
            this.logger.warn(`좌표를 찾을 수 없음: ${activity.location} (Query: ${activity.placeSearchQuery || ''})`);
            return {
              ...activity,
              coordinates: {
                latitude: null,
                longitude: null,
              },
            };
          }),
        );

        return {
          ...dayPlan,
          activities: activitiesWithCoordinates,
        };
      }),
    );

    this.logger.log('좌표 정보 채우기 완료');

    return {
      recommendedDestinations: result.recommendedPlaces || [],
      schedule: scheduleWithCoordinates,
      summary: result.summary || '',
    };
  }
}
