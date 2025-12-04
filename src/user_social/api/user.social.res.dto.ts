import { ApiProperty } from '@nestjs/swagger';
import { LoginTokenResDto } from '../../auth/api/token.res.dto';

export class UserSocialLoginResDto extends LoginTokenResDto {
  @ApiProperty({
    type: String,
    description: '유저 id',
  })
  // =====================================================
  readonly userId: string;

  @ApiProperty({
    type: String,
    description: '유저 이름',
  })
  // =====================================================
  readonly userName: string;
}
