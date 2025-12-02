import { Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScheduleService } from '../application/schedule.service';
import { ScheduleRecommendReqDto } from './schedule.req.dto';
import { ScheduleRecommendResDto } from './schedule.res.dto';

@ApiTags('schedule')
@Controller('')
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  @ApiOperation({
    summary: 'AI 여행 일정 추천 API',
    description: '사용자 입력을 기반으로 AI가 여행 일정을 추천합니다.',
  })
  @ApiOkResponse({
    type: ScheduleRecommendResDto,
    description: '여행 일정 추천 성공',
  })
  @ApiBadRequestResponse({
    description: '잘못된 입력 값',
  })
  @Post('/schedule/recommend')
  async recommendSchedule(@Body() reqDto: ScheduleRecommendReqDto): Promise<ScheduleRecommendResDto> {
    return this.scheduleService.recommendSchedule(reqDto);
  }
}
