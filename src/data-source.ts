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
    // 프로덕션: 컴파일된 JS 파일 사용 (dist/src/migrations/*.js)
    // 개발: TypeScript 소스 파일 사용 (src/migrations/*.ts with ts-node)
    process.env.NODE_ENV === 'prod'
      ? path.join(__dirname, 'migrations', '*.js')
      : path.join(process.cwd(), 'src', 'migrations', '*.ts'),
  ],

  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true',
});

export default dataSource;
