import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { SqlLogger } from '../common/api/sql.logger';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const host = configService.get<string>('DATABASE_HOST');
        const port = Number(configService.get<string>('DATABASE_PORT')) || 3306;
        const username = configService.get<string>('DATABASE_USERNAME');
        const password = configService.get<string>('DATABASE_PASSWORD');
        const database = configService.get<string>('DATABASE_DATABASE');
        const logging = configService.get<string>('DATABASE_LOGGING') === 'true';
        const synchronize = configService.get<string>('DATABASE_SYNCHRONIZE') === 'true';

        if (!host || !username || !database) {
          logger.error('DATABASE_HOST/USERNAME/DATABASE is not set');
          throw new Error('DATABASE config missing');
        }

        logger.log(`MySQL host=${host}:${port}`);
        logger.log(`MySQL db=${database}`);

        return {
          type: 'mysql',
          host,
          port,
          username,
          password,
          database,
          timezone: 'local',
          namingStrategy: new SnakeNamingStrategy(),
          logger: new SqlLogger(),
          logging,
          synchronize,
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        };
      },
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid TypeORM options');
        }
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
  ],
})
export class DatabaseModule {}
