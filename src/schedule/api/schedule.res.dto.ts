import { ApiProperty } from '@nestjs/swagger';

export class TravelCoordinatesDto {
  @ApiProperty({
    description: '위도',
    example: 37.566536,
  })
  latitude: number;

  @ApiProperty({
    description: '경도',
    example: 126.977966,
  })
  longitude: number;
}

export class TravelActivityDto {
  @ApiProperty({
    description: '시간대',
    example: '09:00-12:00',
  })
  time: string;

  @ApiProperty({
    description: '장소명',
    example: '무교동북어국집',
  })
  location: string;

  @ApiProperty({
    description: '카테고리',
    example: '식당',
  })
  category: string;

  @ApiProperty({
    description: '구글 리뷰 별점',
    example: 4.4,
    required: false,
  })
  rating?: number;

  @ApiProperty({
    description: '운영 시간',
    example: '10:00~17:00',
    required: false,
  })
  operatingHours?: string;

  @ApiProperty({
    description: '다음 장소까지 이동 시간',
    example: '28분',
    required: false,
  })
  travelTime?: string;

  @ApiProperty({
    description: '장소 설명',
    example: '맛있는 북어국집',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: '좌표 정보',
    type: TravelCoordinatesDto,
    required: false,
  })
  coordinates?: TravelCoordinatesDto;
}

export class TravelDayPlanDto {
  @ApiProperty({
    description: '일차',
  })
  day: number;

  @ApiProperty({
    description: '날짜 (yyyy-MM-dd)',
  })
  date: string;

  @ApiProperty({
    description: '활동 목록',
    type: [TravelActivityDto],
  })
  activities: TravelActivityDto[];
}

export class ScheduleRecommendResDto {
  @ApiProperty({
    description: '추천 여행지 목록',
    type: [String],
  })
  recommendedDestinations: string[];

  @ApiProperty({
    description: '일정 (Day 1 ~ N)',
    type: [TravelDayPlanDto],
  })
  schedule: TravelDayPlanDto[];

  @ApiProperty({
    description: '전체 일정 요약',
  })
  summary: string;
}
