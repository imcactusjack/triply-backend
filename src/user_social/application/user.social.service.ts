import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../document/user.document';
import { UserSocialLoginResDto } from '../api/user.social.res.dto';
import { SocialExtern } from '../infra/social.extern';
import { IUserGetInfo } from '../interface/user.social';
import { UserSocialLoginReqDto } from '../api/user.social.req.dto';
import { ILoginUserInfo } from '../../auth/interface/login.user';
import { ILoginTokenValidator } from '../../auth/interface/login.token.validator';

@Injectable()
export class UserSocialService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private socialExtern: SocialExtern,
    @Inject('ILoginTokenValidator')
    private loginTokenValidator: ILoginTokenValidator,
  ) {}

  async socialLogin(getBody: UserSocialLoginReqDto): Promise<UserSocialLoginResDto> {
    let socialUser: IUserGetInfo = {
      provider: getBody.provider,
      phone: undefined,
      birthDate: undefined,
      name: '',
      email: '',
    };

    if (getBody.provider === 'GOOGLE') {
      const data = await this.socialExtern.getUserByGoogleToken(getBody.token);
      socialUser = { provider: getBody.provider, email: data.email, name: data.name, phone: data.phone };
    } else if (getBody.provider === 'KAKAO') {
      const data = await this.socialExtern.getUserByKakaoAccessToken(getBody.token);
      socialUser = { provider: getBody.provider, email: data.email, name: data.name, phone: data.phone };
    } else if (getBody.provider === 'NAVER') {
      const data = await this.socialExtern.getUserByNaverToken(getBody.token);
      socialUser = { provider: getBody.provider, email: data.email, name: data.name, phone: data.phone };
    }
    if (!socialUser.email) {
      throw new InternalServerErrorException('user email error');
    }

    const user = await this.userModel.findOne({
      provider: socialUser.provider,
      email: socialUser.email,
      deletedAt: null,
    });

    let loginUserInfo: ILoginUserInfo = {
      id: user?._id.toString() || '',
      name: user?.name || '',
      email: user?.email || '',
    };

    if (!user) {
      const dupEmailUser = await this.userModel.findOne({
        email: socialUser.email,
        deletedAt: null,
      });

      if (dupEmailUser) {
        throw new BadRequestException('Already Signup email');
      }

      const createUser = await this.userModel.create({
        name: socialUser.name || '',
        provider: socialUser.provider,
        email: socialUser.email,
        password: null,
      });

      loginUserInfo = {
        id: createUser._id.toString(),
        name: createUser.name,
        email: createUser.email,
      };
    } else {
      loginUserInfo = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      };
    }

    if (!loginUserInfo || !loginUserInfo.id) {
      throw new InternalServerErrorException('user is not created');
    }

    return this.loginTokenValidator.issuance(loginUserInfo);
  }
}
