import { ApiProperty } from '@nestjs/swagger';
import { TokenDto } from '../../auth/api/token.res.dto';

export class UserSocialLoginResDto {
  @ApiProperty({
    type: TokenDto,
    description: 'access 토큰 정보',
  })
  readonly accessToken: TokenDto;

  @ApiProperty({
    type: TokenDto,
    description: 'refresh 토큰 정보',
  })
  readonly refreshToken: TokenDto;

  @ApiProperty({
    type: String,
    description: '유저 ID',
  })
  readonly userId: string;

  @ApiProperty({
    type: String,
    description: '유저 이름',
  })
  readonly userName: string;
}
