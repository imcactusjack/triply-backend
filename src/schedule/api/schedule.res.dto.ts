import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TravelCoordinatesDto {
  @ApiProperty({
    description: '위도',
    nullable: true,
  })
  latitude: number | null;

  @ApiProperty({
    description: '경도',
    nullable: true,
  })
  longitude: number | null;
}

export class TravelActivityDto {
  @ApiProperty({
    description: '시간대',
  })
  time: string;

  @ApiProperty({
    description: '장소명',
  })
  location: string;

  @ApiPropertyOptional({
    description: '구글 Places 검색용 쿼리',
  })
  placeSearchQuery?: string;

  @ApiProperty({
    description: '카테고리',
  })
  categories: string[];

  @ApiPropertyOptional({
    description: 'Google Places place_id',
  })
  placeId?: string;

  @ApiPropertyOptional({
    description: '구글 리뷰 별점',
  })
  rating?: number;

  @ApiPropertyOptional({
    description: '운영 시간(요일별 배열)',
    type: [String],
  })
  operatingHours?: string[];

  @ApiPropertyOptional({
    description: '다음 장소까지 이동 시간(분)',
  })
  travelTime?: number;

  @ApiPropertyOptional({
    description: '장소 설명',
  })
  description?: string;

  @ApiProperty({
    description: '좌표 정보',
  })
  coordinates: TravelCoordinatesDto;
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
  })
  activities: TravelActivityDto[];
}

export class ScheduleRecommendResDto {
  @ApiProperty({
    description: '추천 여행지 목록',
  })
  recommendedDestinations: string[];

  @ApiProperty({
    description: '일정 ex) Day 1 ~ N',
  })
  schedule: TravelDayPlanDto[];

  @ApiProperty({
    description: '전체 일정 요약',
  })
  summary: string;
}
