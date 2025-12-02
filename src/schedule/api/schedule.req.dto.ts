import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  ValidateNested,
  IsDateString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'isEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const startDate = (args.object as TravelDateDto).startDate;
    if (!startDate || !endDate) {
      return true;
    }
    return new Date(endDate) > new Date(startDate);
  }

  defaultMessage(args: ValidationArguments) {
    return '여행 종료일은 시작일보다 이후여야 합니다.';
  }
}

class TravelDateDto {
  @ApiProperty({
    description: '여행 시작일 ex) yyyy-MM-dd',
    example: '2024-01-01',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: '여행 종료일 ex) yyyy-MM-dd',
    example: '2024-01-03',
  })
  @IsNotEmpty()
  @IsDateString()
  @Validate(IsEndDateAfterStartDateConstraint)
  endDate: string;
}

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
  companions: string;

  @ApiProperty({
    description: '여행 기간',
    type: TravelDateDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TravelDateDto)
  dates: TravelDateDto;

  @ApiProperty({
    description: '여행 컨셉 (맛집, 관광지, 자연, 휴식, 쇼핑, 액티비티, 핫플 등)',
    example: '맛집',
  })
  @IsNotEmpty()
  @IsString()
  concept: string;

  @ApiProperty({
    description: '추가 선호사항 (선택사항)',
    example: '조용한 곳 선호',
    required: false,
  })
  @IsOptional()
  @IsString()
  preferences?: string;
}
