import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLMClient } from '../../infrastructure/llm/interface/llm.client';
import { TravelActivity, TravelDayPlan, TravelPlanLLMInput } from '../../infrastructure/interface/travel.plan.type';
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
    // 1. Workspace 이름 생성
    const workspaceName = `${request.startDate}~${request.endDate} ${request.destination} 여행`;

    const workspace = this.workspaceRepository.create({
      name: workspaceName,
      ownerId: userId,
      memberUserIds: null,
    });

    // 2. Workspace 생성
    const saveWorkspace = await this.workspaceRepository.save(workspace);

    const llmInput: TravelPlanLLMInput = {
      departure: request.departure,
      destination: request.destination,
      companion: request.companion,
      startDate: request.startDate,
      endDate: request.endDate,
      concept: request.concept,
      preference: request.preference,
    };

    // 3. LLM으로 여행 일정 생성
    const result = await this.llmClient.generateTravelPlan(llmInput);

    // 4. 각 활동의 좌표 및 장소 정보 채우기
    this.logger.log('좌표 및 장소 정보 채우기 시작...');
    const scheduleWithCoordinates: TravelDayPlan[] = await Promise.all(
      result.schedule.map(async (dayPlan: TravelDayPlan): Promise<TravelDayPlan> => {
        const activitiesWithCoordinates: TravelActivity[] = await Promise.all(
          dayPlan.activities.map(async (activity: TravelActivity): Promise<TravelActivity> => {
            const placeDetails = activity.placeSearchQuery
              ? await this.placesClient.getPlaceDetails(activity.placeSearchQuery)
              : null;

            const hasCoords = activity.coordinates?.latitude !== null && activity.coordinates?.longitude !== null;

            const finalCoordinates =
              hasCoords && activity.coordinates
                ? activity.coordinates
                : placeDetails
                  ? {
                      latitude: placeDetails.latitude,
                      longitude: placeDetails.longitude,
                    }
                  : {
                      latitude: null,
                      longitude: null,
                    };

            if (!hasCoords && !placeDetails) {
              this.logger.warn(
                `좌표/상세를 찾을 수 없음: ${activity.location} (Query: ${activity.placeSearchQuery || ''})`,
              );
            }

            return {
              ...activity,
              placeId: placeDetails?.placeId ?? activity.placeId,
              rating: placeDetails?.rating ?? activity.rating,
              operatingHours: placeDetails?.openingHoursText ?? this.toOperatingHoursArray(activity.operatingHours),
              coordinates: finalCoordinates,
            };
          }),
        );

        return {
          ...dayPlan,
          activities: activitiesWithCoordinates,
        } satisfies TravelDayPlan;
      }),
    );

    this.logger.log('좌표 및 장소 정보 채우기 완료');

    // 5. Schedule 저장
    const scheduleData = scheduleWithCoordinates.map((dayPlan: TravelDayPlan) => ({
      day: dayPlan.day,
      date: dayPlan.date,
      activities: dayPlan.activities.map((activity: TravelActivity) => ({
        time: activity.time,
        location: activity.location,
        categories: activity.categories,
        placeId: activity.placeId,
        rating: activity.rating,
        operatingHours: this.toOperatingHoursArray(activity.operatingHours),
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

  private toOperatingHoursArray(value: string | string[] | undefined): string[] | undefined {
    if (Array.isArray(value)) {
      const filtered = value.filter((v) => typeof v === 'string');
      return filtered.length > 0 ? filtered : undefined;
    }
    if (typeof value === 'string') {
      return value.trim() ? [value] : undefined;
    }
    return undefined;
  }
}
