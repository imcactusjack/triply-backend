import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserSocialLoginReqDto {
  @ApiProperty({
    type: String,
    description: 'social 에서 전달하는 token (naver인 경우 code)',
  })
  // =================================
  @IsNotEmpty()
  @IsString()
  readonly token: string;

  @ApiPropertyOptional({
    type: String,
    description: 'naver로그인인 경우) naver 에서 전달하는 state',
  })
  // =================================
  @IsOptional()
  @IsString()
  readonly state?: string;

  @ApiProperty({
    type: String,
    description: 'OAuth 제공사 ex) KAKAO, NAVER, GOOGLE',
  })
  @IsIn(['KAKAO', 'GOOGLE', 'NAVER'])
  readonly provider: string;
}
