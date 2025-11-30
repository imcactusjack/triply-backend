import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../document/user.document';
import { UserSocialController } from './api/user.social.controller';
import { SocialExtern } from './infra/social.extern';
import { HttpModule } from '@nestjs/axios';
import { UserSocialService } from './application/user.social.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, HttpModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UserSocialController],
  providers: [UserSocialService, SocialExtern],
})
export class UserSocialModule {}
