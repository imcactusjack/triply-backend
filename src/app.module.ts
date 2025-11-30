import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from './common/api/logger.middleware';
import { AuthModule } from './auth/auth.module';
import { UserSocialModule } from './user_social/user.social.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        ...(process.env.NODE_ENV === 'prod' ? ['.env.prod'] : []),
        ...(process.env.NODE_ENV !== 'prod' ? ['.env.local'] : []),
      ],
    }),
    DatabaseModule,
    // MulterModule.registerAsync({
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     dest: configService.getOrThrow('UPLOAD_IMAGE_FILE_PATH'),
    //   }),
    // }),
    AuthModule,
    UserModule,
    UserSocialModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
