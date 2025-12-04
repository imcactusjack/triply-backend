import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseDocument } from '../common/document/base.document';
import { AuthProvider } from '../common/domain/enum/auth.provider';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true })
export class User extends BaseDocument {
  @Prop({ required: false, comment: 'social 로그인 방식 ex) GOOGLE, KAKAO, NAVER' })
  provider?: AuthProvider;

  @Prop({ required: false, unique: true, comment: 'social 제공자가 제공하는 고유 user id, 자체 회원가입인 경우 null' })
  socialId?: string;

  @Prop({ required: false, maxlength: 100, comment: '이메일' })
  email?: string;

  @Prop({ required: false, maxlength: 500, comment: '비밀번호 소셜일시 null' })
  password?: string;

  @Prop({ required: true, maxlength: 100, comment: '유저 이름' })
  name: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
