import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UserSocialLoginReqDto {
  @ApiProperty({
    type: String,
    description: 'social 에서 전달하는 token',
  })
  // =================================
  @IsNotEmpty()
  @IsString()
  readonly token: string;

  @ApiProperty({
    type: String,
    description: 'OAuth 제공사 ex) KAKAO, GOOGLE',
  })
  @IsIn(['KAKAO', 'GOOGLE'])
  readonly provider: string;
}
