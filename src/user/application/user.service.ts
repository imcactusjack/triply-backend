import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserLoginByEmailPasswordReqDto, UserSignUpReqDto } from '../api/user.req.dto';
import { PasswordBcryptEncrypt } from '../../auth/infrastructure/password.bcrypt.encrypt';
import { ILoginTokenValidator } from '../../auth/interface/login.token.validator';
import { User, UserDocument } from '../../document/user.document';
import { ILoginUserInfo } from '../../auth/interface/login.user';

@Injectable()
export class UserService {
  constructor(
    private passwordEncrypt: PasswordBcryptEncrypt,
    @Inject('ILoginTokenValidator')
    private loginTokenValidator: ILoginTokenValidator,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async isExistEmail(email: string) {
    const dupEmailUser = await this.userModel.findOne({
      email: email,
      deletedAt: null,
    });

    return !!dupEmailUser;
  }

  async signUp(signUpDto: UserSignUpReqDto) {
    // 1. 이미 동일한 이메일을 사용한 유저가 존재하는지 validation
    const dupEmail = await this.userModel.countDocuments({
      email: signUpDto.email,
      deletedAt: null,
    });

    // 1.1 동일한 이메일 유저 계정이 존재할 경우 error
    if (dupEmail) {
      throw new BadRequestException('duplicate user email');
    }

    // 2. password encrypt (암호화)
    const passwordEncrypt = await this.passwordEncrypt.encrypt(signUpDto.password);

    // 3. 유저 계정 생성
    await this.userModel.create({
      email: signUpDto.email,
      password: passwordEncrypt,
      name: signUpDto.name,
    });
    return;
  }

  async loginByEmailPassword(loginDto: UserLoginByEmailPasswordReqDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({
      email: email,
      deletedAt: null,
    });

    if (!user) {
      throw new BadRequestException('USER_DOES_NOT_EXIST');
    }
    if (!user.password || user.provider) {
      throw new BadRequestException('USER_DOES_NOT_SIGN_UP_EMAIL');
    }
    const isPasswordMatch = await this.passwordEncrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new BadRequestException('USER_DO_NOT_MATCH_PASSWORD');
    }

    const loginUserInfo: ILoginUserInfo = {
      id: user._id.toString(),
      name: user.name || '',
      socialId: user.email,
      email: user.email,
    };

    return {
      ...this.loginTokenValidator.issuance(loginUserInfo),
      userId: user._id,
      userName: user.name,
    };
  }

  async getAccessByRefresh(token: string) {
    const userDecode = this.loginTokenValidator.validateByToken(token);

    const user = await this.userModel.findOne({
      _id: userDecode.id,
      deletedAt: null,
    });

    if (!user) {
      throw new BadRequestException('USER_DOES_NOT_EXIST');
    }

    const loginToken = this.loginTokenValidator.issuance(userDecode);

    return {
      accessToken: loginToken.accessToken,
    };
  }

  async getLoginTokenByRefresh(token: string) {
    const userDecode = this.loginTokenValidator.validateByToken(token);

    const user = await this.userModel.findOne({
      _id: userDecode.id,
      deletedAt: null,
    });

    if (!user) {
      throw new BadRequestException('USER_DOES_NOT_EXIST');
    }

    return this.loginTokenValidator.issuance(userDecode);
  }
}
