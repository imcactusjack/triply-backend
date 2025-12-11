import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScheduleService } from '../application/schedule.service';
import { ScheduleRecommendReqDto } from './schedule.req.dto';
import { ScheduleRecommendResDto } from './schedule.res.dto';
import { AuthUserAuthorizationGuard } from 'src/auth/api/auth.user.authorization.guard';
import { ILoginUserInfo } from 'src/auth/interface/login.user';
import { User } from 'src/auth/api/user.decorator';

@ApiTags('schedule')
@Controller('')
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'AI 여행 일정 추천 API',
    description: '사용자 입력을 기반으로 AI가 여행 일정을 추천합니다.',
  })
  @ApiOkResponse({
    type: ScheduleRecommendResDto,
    description: '정상적으로 추천할 경우',
  })
  @UseGuards(AuthUserAuthorizationGuard)
  @Post('/schedule/recommend')
  async recommendSchedule(@User() user: ILoginUserInfo, @Body() request: ScheduleRecommendReqDto) {
    return this.scheduleService.recommendSchedule(user.id, request);
  }
}
