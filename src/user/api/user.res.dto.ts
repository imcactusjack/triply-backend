import { LoginTokenResDto, TokenDto } from '../../auth/api/token.res.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UserLoginByEmailPasswordResDto {
  @ApiProperty({
    type: String,
    description: 'access 토큰 값',
  })
  // =====================================================
  readonly accessToken: string;

  @ApiProperty({
    type: String,
    description: 'access 토큰 만료 날짜',
  })
  // =====================================================
  readonly expiredAt: string;
}

export class UserAccessByRefreshResDto {
  @ApiProperty({
    type: TokenDto,
    description: 'access 토큰 정보',
  })
  // =====================================================
  readonly accessToken: TokenDto;
}

export class UserRefreshByRefreshResDto extends LoginTokenResDto { }
