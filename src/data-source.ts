import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as path from 'path';

// 환경 변수 로드
config({
  path: process.env.NODE_ENV === 'prod' ? '.env.prod' : '.env.local',
});

export default new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_DATABASE,
  timezone: 'local',
  namingStrategy: new SnakeNamingStrategy(),
  entities: [path.join(__dirname, '**', '*.entity{.ts,.js}')],
  migrations: [
    // 개발 환경: src/migrations
    path.join(__dirname, 'migrations', '*.ts'),
    // 프로덕션 환경: dist/src/migrations (빌드된 경우) 또는 src/migrations (복사된 경우)
    path.join(process.cwd(), 'src', 'migrations', '*.ts'),
  ],
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true',
});
