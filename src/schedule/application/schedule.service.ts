import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLMClient, TravelPlanLLMInput } from '../../infrastructure/llm/interface/llm.client';
import { IPlacesClient } from '../../infrastructure/places/interface/places.client';
import { ScheduleRecommendReqDto } from '../api/schedule.req.dto';
import { ScheduleRecommendResDto } from '../api/schedule.res.dto';
import { WorkspaceEntity } from '../../entity/workspace.entity';
import { ScheduleEntity } from '../../entity/schedule.entity';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger('ScheduleService');

  constructor(
    @Inject('ILlmClient') private llmClient: LLMClient,
    @Inject('IPlacesClient') private placesClient: IPlacesClient,
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(ScheduleEntity)
    private scheduleRepository: Repository<ScheduleEntity>,
  ) {}

  @Transactional()
  async recommendSchedule(userId: string, request: ScheduleRecommendReqDto): Promise<ScheduleRecommendResDto> {
    // 1. Workspace 이름 생성: ${startDate}~${endDate} ${destination} 여행
    const workspaceName = `${request.dates.startDate}~${request.dates.endDate} ${request.destination} 여행`;
    this.logger.log(`Workspace 생성 시작: ${workspaceName}`);

    const workspace = this.workspaceRepository.create({
      name: workspaceName,
      ownerId: userId,
      memberUserIds: [userId],
    });

    // 2. Workspace 생성 (트랜잭션 세션 사용)
    const saveWorkspace = await this.workspaceRepository.save(workspace);

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

    // 3. LLM으로 여행 일정 생성
    const result = await this.llmClient.generateTravelPlan(llmInput);

    // 4. 각 활동의 좌표 정보 채우기
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

    // 5. Schedule 저장
    const scheduleData = scheduleWithCoordinates.map((dayPlan) => ({
      day: dayPlan.day,
      date: dayPlan.date,
      activities: dayPlan.activities.map((activity) => ({
        time: activity.time,
        location: activity.location,
        categories: activity.categories,
        rating: activity.rating,
        operatingHours: activity.operatingHours,
        travelTime: activity.travelTime,
        description: activity.description,
        coordinates: activity.coordinates
          ? {
              latitude: activity.coordinates.latitude,
              longitude: activity.coordinates.longitude,
            }
          : undefined,
        locationGeoJson:
          activity.coordinates?.latitude !== null && activity.coordinates?.longitude !== null
            ? {
                type: 'Point' as const,
                coordinates: [activity.coordinates.longitude, activity.coordinates.latitude],
              }
            : undefined,
      })),
    }));

    const schedule = this.scheduleRepository.create({
      workspaceId: saveWorkspace.id,
      recommendedDestinations: JSON.stringify(result.recommendedPlaces) ?? '[]',
      schedule: JSON.stringify(scheduleData),
    });

    await this.scheduleRepository.save(schedule);

    return {
      recommendedDestinations: result.recommendedPlaces || [],
      schedule: scheduleWithCoordinates,
      summary: result.summary || '',
    };
  }
}
