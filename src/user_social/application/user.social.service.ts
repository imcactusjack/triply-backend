import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuthProvider } from '../../common/domain/enum/auth.provider';
import { UserEntity } from '../../entity/user.entity';
import { SocialExtern } from '../infra/social.extern';
import { IUserGetInfo } from '../interface/user.social';
import { UserSocialLoginReqDto } from '../api/user.social.req.dto';
import { ILoginUserInfo } from '../../auth/interface/login.user';
import { ILoginTokenValidator } from '../../auth/interface/login.token.validator';
import { UserSocialLoginResDto } from '../api/user.social.res.dto';

@Injectable()
export class UserSocialService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private socialExtern: SocialExtern,
    @Inject('ILoginTokenValidator')
    private loginTokenValidator: ILoginTokenValidator,
  ) {}

  async socialLogin(getBody: UserSocialLoginReqDto): Promise<UserSocialLoginResDto> {
    const provider = getBody.provider as AuthProvider;
    let socialUser: IUserGetInfo = {
      provider,
      socialId: '',
      phone: undefined,
      birthDate: undefined,
      name: '',
      email: undefined,
    };

    if (getBody.provider === 'GOOGLE') {
      const data = await this.socialExtern.getUserByGoogleToken(getBody.token);
      socialUser = {
        provider,
        socialId: data.socialId,
        email: data.email,
        name: data.name,
        phone: data.phone,
        birthDate: data.birthDate,
      };
    } else if (getBody.provider === 'KAKAO') {
      const data = await this.socialExtern.getUserByKakaoAccessToken(getBody.token);
      socialUser = {
        provider,
        socialId: data.socialId,
        email: data.email,
        name: data.name,
        phone: data.phone,
        birthDate: data.birthDate,
      };
    } else if (getBody.provider === 'NAVER') {
      const data = await this.socialExtern.getUserByNaverCode(getBody.token, getBody.state);
      socialUser = {
        provider,
        socialId: data.socialId,
        email: data.email,
        name: data.name,
        phone: data.phone,
        birthDate: data.birthDate,
      };
    }

    const user = await this.userRepository.findOne({
      where: {
        provider: provider,
        socialId: socialUser.socialId,
        deletedAt: IsNull(),
      },
    });

    let loginUserInfo: ILoginUserInfo = {
      id: user?.id || '',
      name: user?.name || '',
      email: user?.email ?? '',
      socialId: user?.socialId ?? '',
    };

    if (!user) {
      const createUser = await this.userRepository.save(
        this.userRepository.create({
          name: socialUser.name,
          provider: provider,
          socialId: socialUser.socialId,
          email: socialUser.email ?? null,
          password: null,
        }),
      );

      loginUserInfo = {
        id: createUser.id,
        name: createUser.name,
        socialId: createUser.socialId ?? '',
        email: createUser.email ?? '',
      };
    } else {
      loginUserInfo = {
        id: user.id,
        name: user.name,
        socialId: user.socialId ?? '',
        email: user.email ?? '',
      };
    }

    return {
      ...this.loginTokenValidator.issuance(loginUserInfo),
      userId: loginUserInfo.id,
      userName: loginUserInfo.name,
    };
  }
}
