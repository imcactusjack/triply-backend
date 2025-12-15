import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLMClient } from '../../infrastructure/llm/interface/llm.client';
import { TravelActivity, TravelDayPlan, TravelPlanLLMInput } from '../../infrastructure/interface/travel.plan.type';
import { IPlacesClient } from '../../infrastructure/places/interface/places.client';
import { ScheduleCreateReqDto, ScheduleRecommendReqDto } from '../api/schedule.req.dto';
import {
  ScheduleRecommendResDto,
  TravelActivityResDto,
  TravelCoordinatesResDto,
  TravelDayPlanResDto,
} from '../api/schedule.res.dto';
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
    const scheduleWithCoordinates: TravelDayPlanResDto[] = await Promise.all(
      result.schedule.map(async (dayPlan: TravelDayPlan): Promise<TravelDayPlanResDto> => {
        const activitiesWithCoordinates: TravelActivityResDto[] = await Promise.all(
          dayPlan.activities.map(async (activity: TravelActivity): Promise<TravelActivityResDto> => {
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

            const activityDto = new TravelActivityResDto();
            activityDto.order = activity.order;
            activityDto.activityStartTime = activity.activityStartTime;
            activityDto.activityEndTime = activity.activityEndTime;
            activityDto.location = activity.location;
            activityDto.placeSearchQuery = activity.placeSearchQuery;
            activityDto.categories = activity.categories;
            activityDto.placeId = placeDetails?.placeId ?? activity.placeId;
            activityDto.rating = placeDetails?.rating ?? activity.rating;
            activityDto.operatingHours =
              placeDetails?.openingHoursText ?? this.toOperatingHoursArray(activity.operatingHours);
            activityDto.travelTime = activity.travelTime;
            activityDto.description = activity.description;

            const coordinatesDto = new TravelCoordinatesResDto();
            coordinatesDto.latitude = finalCoordinates.latitude;
            coordinatesDto.longitude = finalCoordinates.longitude;
            activityDto.coordinates = coordinatesDto;

            return activityDto;
          }),
        );

        const dayPlanDto = new TravelDayPlanResDto();
        dayPlanDto.day = dayPlan.day;
        dayPlanDto.date = dayPlan.date;
        dayPlanDto.activities = activitiesWithCoordinates;

        return dayPlanDto;
      }),
    );

    this.logger.log('좌표 및 장소 정보 채우기 완료');

    // 5. Schedule 저장
    const scheduleData = scheduleWithCoordinates.map((dayPlan: TravelDayPlan) => ({
      day: dayPlan.day,
      date: dayPlan.date,
      activities: dayPlan.activities.map((activity: TravelActivity) => ({
        order: activity.order,
        activityStartTime: activity.activityStartTime,
        activityEndTime: activity.activityEndTime,
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
      schedule: JSON.stringify(scheduleData),
    });

    await this.scheduleRepository.save(schedule);

    const response = new ScheduleRecommendResDto();
    response.recommendedDestinations = result.recommendedPlaces || [];
    response.schedule = scheduleWithCoordinates;
    response.summary = result.summary || '';

    return response;
  }

  @Transactional()
  async createSchedule(userId: string, request: ScheduleCreateReqDto): Promise<boolean> {
    // 1. Workspace 존재 확인 및 권한 확인
    const workspace = await this.workspaceRepository.findOne({
      where: { id: request.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('워크스페이스가 존재하지 않습니다.');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('워크스페이스 접근 권한이 없습니다.');
    }

    // 2. Schedule 데이터 변환 및 저장
    const scheduleData = request.schedule.map((dayPlan: TravelDayPlan) => ({
      day: dayPlan.day,
      date: dayPlan.date,
      activities: dayPlan.activities.map((activity: TravelActivity) => ({
        order: activity.order,
        activityStartTime: activity.activityStartTime,
        activityEndTime: activity.activityEndTime,
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
      workspaceId: request.workspaceId,
      schedule: JSON.stringify(scheduleData),
    });

    await this.scheduleRepository.save(schedule);

    return true;
  }

  async getSchedule(userId: string, workspaceId: number): Promise<ScheduleRecommendResDto> {
    // 1. Workspace 존재 확인 및 권한 확인
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('워크스페이스가 존재하지 않습니다.');
    }

    const isOwner = String(workspace.ownerId) === String(userId);

    // memberUserIds는 JSON 문자열로 저장되어 있을 수 있음
    let memberIds: string[] = [];
    if (workspace.memberUserIds) {
      try {
        memberIds = JSON.parse(workspace.memberUserIds);
      } catch {
        memberIds = workspace.memberUserIds.split(',').map((id) => id.trim());
      }
    }
    const isMember = Array.isArray(memberIds) && memberIds.includes(String(userId));

    if (!isOwner && !isMember) {
      throw new ForbiddenException('워크스페이스 접근 권한이 없습니다.');
    }

    // 2. Schedule 조회
    const scheduleEntity = await this.scheduleRepository.findOne({
      where: { workspaceId },
    });

    if (!scheduleEntity) {
      throw new NotFoundException('일정이 존재하지 않습니다.');
    }

    type PersistedActivity = {
      order: number;
      activityStartTime: string | null;
      activityEndTime: string | null;
      location: string;
      placeSearchQuery?: string;
      categories: string[];
      placeId?: string;
      rating?: number;
      operatingHours?: string[];
      travelTime?: number;
      description?: string;
      coordinates?: { latitude: number | null; longitude: number | null };
      locationGeoJson?: { type: 'Point'; coordinates: [number, number] };
    };

    type PersistedDayPlan = {
      day: number;
      date: string;
      activities: PersistedActivity[];
    };

    const scheduleData = JSON.parse(scheduleEntity.schedule) as PersistedDayPlan[];

    // DB에서 가져온 데이터를 DTO로 변환
    const scheduleDto: TravelDayPlanResDto[] = scheduleData.map((dayPlan: PersistedDayPlan) => {
      const dayPlanDto = new TravelDayPlanResDto();
      dayPlanDto.day = dayPlan.day;
      dayPlanDto.date = dayPlan.date;
      dayPlanDto.activities = dayPlan.activities.map((activity: PersistedActivity) => {
        const activityDto = new TravelActivityResDto();
        activityDto.order = activity.order;
        activityDto.activityStartTime = activity.activityStartTime ?? null;
        activityDto.activityEndTime = activity.activityEndTime ?? null;
        activityDto.location = activity.location;
        activityDto.placeSearchQuery = activity.placeSearchQuery;
        activityDto.categories = activity.categories;
        activityDto.placeId = activity.placeId;
        activityDto.rating = activity.rating;
        activityDto.operatingHours = activity.operatingHours;
        activityDto.travelTime = activity.travelTime;
        activityDto.description = activity.description;

        const coordinatesDto = new TravelCoordinatesResDto();
        coordinatesDto.latitude = activity.coordinates?.latitude ?? null;
        coordinatesDto.longitude = activity.coordinates?.longitude ?? null;
        activityDto.coordinates = coordinatesDto;

        return activityDto;
      });
      return dayPlanDto;
    });

    const response = new ScheduleRecommendResDto();
    response.schedule = scheduleDto;
    response.summary = '';

    return response;
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
