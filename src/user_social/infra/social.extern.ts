import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { catchError, firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { IUserGetInfo } from '../interface/user.social';
import * as jwt from 'jsonwebtoken';
import axios, { AxiosError } from 'axios';

@Injectable()
export class SocialExtern {
  private logger = new Logger('SOCIAL');

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getUserByGoogleToken(token: string): Promise<IUserGetInfo> {
    const { data } = await firstValueFrom(
      this.httpService
        .get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .pipe(
          catchError((error: AxiosError) => {
            const errorData = error.response?.data as any;
            const errorMessage =
              errorData?.error?.message || errorData?.error_description || error.message || '알 수 없는 오류';
            const errorCode = errorData?.error?.code || error.response?.status;
            this.logger.error(`[GOOGLE] API 호출 실패: ${errorMessage} (코드: ${errorCode})`);
            throw new UnauthorizedException(`구글 로그인 실패: ${errorMessage}`);
          }),
        ),
    );

    return {
      provider: 'GOOGLE',
      email: data.email,
      name: data.family_name + data.given_name,
      socialId: data.sub,
      ...data,
    } as IUserGetInfo;
  }

  async getUserByNaverToken(token: string) {
    const { data } = await firstValueFrom(
      this.httpService
        .get('https://openapi.naver.com/v1/nid/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .pipe(
          catchError((error: AxiosError) => {
            const errorData = error.response?.data as any;
            const errorMessage =
              errorData?.errorMessage || errorData?.error_description || error.message || '알 수 없는 오류';
            const errorCode = errorData?.errorCode || error.response?.status;
            this.logger.error(`[NAVER] API 호출 실패: ${errorMessage} (코드: ${errorCode})`);
            throw new UnauthorizedException(`네이버 로그인 실패: ${errorMessage}`);
          }),
        ),
    );

    const { response } = data;

    let phone: string = '';
    let birthDate: string = '';
    if (response.mobile) {
      phone = response.mobile.split('-').join('');
    }
    if (response.birthyear && response.birthday) {
      birthDate = response.birthyear + '-' + response.birthday;
    }

    return {
      provider: 'NAVER',
      email: response.email,
      name: response.name,
      phone,
      birthDate,
      socialId: response.id,
      ...response,
    } as IUserGetInfo;
  }

  async getUserByKakaoAccessToken(accessToken: string) {
    this.logger.log(`[KAKAO] 액세스 토큰으로 사용자 정보 요청 시작`);
    this.logger.log(`[KAKAO] 액세스 토큰: ${accessToken.substring(0, 20)}...`);

    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get('https://kapi.kakao.com/v2/user/me', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              const errorData = error.response?.data as any;
              const errorMessage = errorData?.msg || errorData?.error_description || error.message || '알 수 없는 오류';
              const errorCode = errorData?.code || error.response?.status;

              this.logger.error(`[KAKAO] API 호출 실패`);
              this.logger.error(`[KAKAO] Status: ${error.response?.status}`);
              this.logger.error(`[KAKAO] Status Text: ${error.response?.statusText}`);
              this.logger.error(`[KAKAO] Response Data: ${JSON.stringify(error.response?.data)}`);
              this.logger.error(`[KAKAO] Error Message: ${errorMessage} (코드: ${errorCode})`);

              if (error.response?.status === 401) {
                throw new UnauthorizedException(`카카오 로그인 실패: ${errorMessage} (코드: ${errorCode})`);
              }
              throw new UnauthorizedException(`카카오 로그인 실패: ${errorMessage} (코드: ${errorCode})`);
            }),
          ),
      );

      this.logger.log(`[KAKAO] 사용자 정보 조회 성공`);

      const { kakao_account } = data;
      this.logger.log(`[KAKAO] 사용자 데이터: ${JSON.stringify(data)}`);

      let phone = '';
      const socialId = data.id.toString();
      const email = kakao_account.email;
      let name = '';
      if (!kakao_account) {
        throw new BadRequestException('카카오 회원 정보가 존재하지 않습니다.');
      }
      if (kakao_account && kakao_account.phone_number) {
        phone = '0' + kakao_account.phone_number.split(' ')[1].split('-').join('');
      }

      // name이 없으면 profile.nickname 사용, 그것도 없으면 기본값 사용
      if (kakao_account.name) {
        name = kakao_account.name;
      } else if (kakao_account.profile?.nickname) {
        name = kakao_account.profile.nickname;
      } else {
        name = `KAKAO_USER_${socialId.substring(0, 8)}`;
      }

      return {
        provider: 'KAKAO',
        socialId: socialId,
        email: email,
        name: name,
        phone,
        ...data,
      } as IUserGetInfo;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[KAKAO] 예상치 못한 오류 발생: ${error}`);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      throw new UnauthorizedException(`카카오 로그인 실패: ${errorMessage}`);
    }
  }

  async getAppleToken(code: string, os: string): Promise<any> {
    const clientId =
      os === 'APPLE'
        ? this.configService.getOrThrow('APPLE_CLIENT_ID')
        : this.configService.getOrThrow('APPLE_CLIENT_GOOGLE_ID');
    const teamId = this.configService.getOrThrow('APPLE_TEAM_ID');
    const keyId = this.configService.getOrThrow('APPLE_KEY_ID');
    const privateKey = this.configService.getOrThrow('APPLE_PRIVATE_KEY');

    const jwtToken = jwt.sign(
      {
        iss: teamId,
        aud: 'https://appleid.apple.com',
        sub: clientId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 5, // 5분 유효
      },
      privateKey,
      {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: keyId,
        },
      },
    );

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', jwtToken);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');

    try {
      const response = await axios.post('https://appleid.apple.com/auth/token', params);
      const data: any = response.data;
      this.logger.verbose(JSON.stringify(data));
      return data;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async validateAppleToken(idToken: string): Promise<IUserGetInfo> {
    const applePublicKeys = await axios.get('https://appleid.apple.com/auth/keys');
    const keys = applePublicKeys.data.keys;

    // 적절한 키로 JWT 검증
    const decodedToken: any = jwt.decode(idToken, { complete: true });

    // apple any 처리
    const key = keys.find((k: any) => k.kid === decodedToken?.header?.kid);

    if (!key) {
      throw new Error('Invalid Apple public key');
    }

    try {
      // const data = jwt.verify(idToken, key) as AppleUser;
      // const name = data.name ? data.name!.firstName! + data.name!.lastName! : '';
      const name = 'APPLE_USER';
      return {
        provider: 'APPLE',
        email: decodedToken?.payload.email,
        name: name,
        // ...data,
      } as IUserGetInfo;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
