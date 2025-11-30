import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { UserSocialLoginResDto } from './user.social.res.dto';
import { UserSocialService } from '../application/user.social.service';
import { UserSocialLoginReqDto } from './user.social.req.dto';

@ApiTags('user-social')
@Controller('')
export class UserSocialController {
  constructor(private userSocialService: UserSocialService) {}

  @ApiOperation({
    summary: '유저 소셜 로그인 API',
    description:
      '소셜 로그인 및 첫 로그인시 회원가입을 진행합니다.<br>' +
      'Provider 에 따라 각 소셜 토큰을 인증 한 후에 서비스에서 사용할 수 있는 토큰을 발행합니다.<br>',
  })
  @ApiOkResponse({
    type: UserSocialLoginResDto,
    description: '성공적으로 로그인한 경우',
  })
  // ==========================================================
  @Post('/user/social/login')
  async socialLogin(@Body() getBody: UserSocialLoginReqDto, @Res() res: Response) {
    const result = await this.userSocialService.socialLogin(getBody);
    
    // refreshToken을 cookie에 설정
    res.cookie('refreshToken', result.refreshToken.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'prod',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
    });

    // accessToken만 body에 반환
    return res.json({
      accessToken: result.accessToken,
    });
  }
}
