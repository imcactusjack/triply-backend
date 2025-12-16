import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScheduleService } from '../application/schedule.service';
import { ScheduleCreateReqDto, ScheduleGetReqDto, ScheduleRecommendReqDto } from './schedule.req.dto';
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
    description: '정상적으로 추천된 경우',
  })
  @UseGuards(AuthUserAuthorizationGuard)
  @Post('/schedule/recommend')
  async recommendSchedule(@User() user: ILoginUserInfo, @Body() request: ScheduleRecommendReqDto) {
    return this.scheduleService.recommendSchedule(user.id, request);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '사용자 직접 일정 생성 API',
    description: '사용자가 직접 일정 데이터를 입력하여 저장합니다.',
  })
  @ApiOkResponse({
    type: Boolean,
    description: '정상적으로 저장된 경우',
  })
  @UseGuards(AuthUserAuthorizationGuard)
  @Post('/schedule')
  async createSchedule(@User() user: ILoginUserInfo, @Body() request: ScheduleCreateReqDto) {
    return this.scheduleService.createSchedule(user.id, request);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '워크스페이스 일정 조회 API',
    description: '워크스페이스 ID로 일정을 조회합니다.',
  })
  @ApiOkResponse({
    type: ScheduleRecommendResDto,
    description: '정상적으로 조회된 경우',
  })
  @UseGuards(AuthUserAuthorizationGuard)
  @Get('/schedule')
  async getSchedule(@User() user: ILoginUserInfo, @Query() request: ScheduleGetReqDto) {
    return this.scheduleService.getSchedule(user.id, request.workspaceId);
  }
}
