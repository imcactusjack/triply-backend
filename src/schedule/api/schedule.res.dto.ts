import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TravelCoordinatesResDto {
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

export class TravelActivityResDto {
  @ApiProperty({
    description: '활동 순서 (0부터 시작)',
  })
  order: number;

  @ApiPropertyOptional({
    description: '활동 시작 시간 ex) HH:mm',
    nullable: true,
  })
  activityStartTime: string | null;

  @ApiPropertyOptional({
    description: '활동 종료 시간 ex) HH:mm',
    nullable: true,
  })
  activityEndTime: string | null;

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
  coordinates: TravelCoordinatesResDto;
}

export class TravelDayPlanResDto {
  @ApiProperty({
    description: '일자',
  })
  day: number;

  @ApiProperty({
    description: '날짜 ex) yyyy-MM-dd',
  })
  date: string;

  @ApiProperty({
    description: '활동 목록',
  })
  activities: TravelActivityResDto[];
}

export class ScheduleRecommendResDto {
  @ApiPropertyOptional({
    description: '추천 여행지 목록',
  })
  recommendedDestinations?: string[];

  @ApiProperty({
    description: '일정 ex) Day 1 ~ N',
  })
  schedule: TravelDayPlanResDto[];

  @ApiPropertyOptional({
    description: '전체 일정 요약',
  })
  summary?: string;
}
