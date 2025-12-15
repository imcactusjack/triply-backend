import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsEndDateAfterStartDate } from '../../common/validator';

export class ScheduleRecommendReqDto {
  @ApiProperty({
    description: '출발지',
    example: '서울',
  })
  @IsNotEmpty()
  @IsString()
  departure: string;

  @ApiProperty({
    description: '목적지',
    example: '제주도',
  })
  @IsNotEmpty()
  @IsString()
  destination: string;

  @ApiProperty({
    description: '동행자 (가족, 친구, 연인, 혼자 등)',
    example: '가족',
  })
  @IsNotEmpty()
  @IsString()
  companion: string;

  @ApiProperty({
    description: '여행 시작일 ex) yyyy-MM-dd',
    example: '2025-01-01',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: '여행 종료일 ex) yyyy-MM-dd',
    example: '2025-01-03',
  })
  @IsNotEmpty()
  @IsDateString()
  @IsEndDateAfterStartDate({ message: '여행 종료일은 시작일보다 이후여야 합니다.' })
  endDate: string;

  @ApiPropertyOptional({
    description: '여행 컨셉 list',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  concept?: string[] = [];

  @ApiPropertyOptional({
    description: '추가 선호사항',
    example: '조용한 곳 선호',
  })
  @IsOptional()
  @IsString()
  preference?: string;
}

export class TravelCoordinatesInsertDto {
  @ApiProperty({
    description: '위도',
  })
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: '경도',
  })
  @IsNotEmpty()
  @IsNumber()
  longitude: number;
}
export class TravelActivityInsertDto {
  @ApiProperty({
    description: '활동 순서 (0부터 시작)',
  })
  @IsNotEmpty()
  @IsNumber()
  order: number;

  @ApiProperty({
    description: '활동 시작 시간 ex) HH:mm',
  })
  @IsString()
  activityStartTime: string | null;

  @ApiProperty({
    description: '활동 종료 시간 ex) HH:mm',
  })
  @IsString()
  activityEndTime: string | null;

  @ApiProperty({
    description: '장소명',
  })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty({
    description: '카테고리',
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @ApiPropertyOptional({
    description: 'Google Places place_id',
  })
  @IsNotEmpty()
  placeId: string;

  @ApiProperty({
    description: '좌표 정보',
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TravelCoordinatesInsertDto)
  coordinates: TravelCoordinatesInsertDto;
}

export class TravelDayPlanInsertDto {
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TravelDayPlanInsertDto)
  activities: TravelActivityInsertDto[];
}

export class ScheduleCreateReqDto {
  @ApiProperty({
    description: '워크스페이스 ID',
  })
  @IsNotEmpty()
  workspaceId: number;

  @ApiProperty({
    description: '여행 일정 데이터',
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TravelDayPlanInsertDto)
  schedule: TravelDayPlanInsertDto[];
}

export class ScheduleGetReqDto {
  @ApiProperty({
    description: '워크스페이스 ID',
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  workspaceId: number;
}
