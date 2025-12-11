import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
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
