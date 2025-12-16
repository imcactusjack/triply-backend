import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as path from 'path';

// 환경 변수 로드
config({
  path: process.env.NODE_ENV === 'prod' ? '.env.prod' : '.env.local',
});

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_DATABASE,
  timezone: 'local',
  namingStrategy: new SnakeNamingStrategy(),

  entities: [
    path.join(__dirname, '**', '*.entity.{js,ts}'),
    path.join(process.cwd(), 'dist', '**', '*.entity.{js,ts}'),
  ],
  migrations: [
    // 프로덕션 환경에서는 src/migrations 사용
    process.env.NODE_ENV === 'prod'
      ? path.join(process.cwd(), 'src', 'migrations', '*.{js,ts}')
      : path.join(__dirname, 'migrations', '*.{js,ts}'),
    // 개발 환경을 위한 fallback
    path.join(process.cwd(), 'src', 'migrations', '*.{js,ts}'),
  ],

  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true',
});

export default dataSource;
