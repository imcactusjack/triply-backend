import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformResInterceptor } from './common/api/transform.res.interceptor';
import * as cookieParser from 'cookie-parser';
import { initializeTransactionalContext } from 'typeorm-transactional';

async function bootstrap() {
  initializeTransactionalContext();
  const logger = new Logger('Bootstrap');

  const envFiles = process.env.NODE_ENV === 'prod' ? ['.env.prod'] : ['.env.local'];
  const nodeEnv = process.env.NODE_ENV || 'local';

  logger.log(`NODE_ENV=${nodeEnv}`);
  logger.log(`Config env files=${envFiles.join(', ')}`);

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalInterceptors(new TransformResInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: false, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Triply Backend API Docs')
    .setDescription('Triply Backend API Docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  let port = 3000;
  if (process.env.PORT) {
    port = +process.env.PORT;
  }
  logger.log(`PORT=${port}`);
  await app.listen(port);
}
bootstrap();
