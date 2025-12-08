# NestJS 코드 스타일 가이드

이 프로젝트는 NestJS 공식 스타일 가이드를 따릅니다.

## 파일명 규칙

### 1. 파일명은 kebab-case 사용

- ✅ 올바른 예: `user.service.ts`, `file-storage.s3.ts`, `mongoose-transaction.interceptor.ts`
- ❌ 잘못된 예: `userService.ts`, `fileStorage.s3.ts`, `mongoose.session.decorator.ts` (점 사용)

### 2. 파일 타입별 접미사

- Service: `*.service.ts`
- Controller: `*.controller.ts`
- Module: `*.module.ts`
- Decorator: `*.decorator.ts`
- Interceptor: `*.interceptor.ts`
- Guard: `*.guard.ts`
- Middleware: `*.middleware.ts`
- Pipe: `*.pipe.ts`
- Filter: `*.filter.ts`
- DTO: `*.dto.ts` (req.dto.ts, res.dto.ts)
- Entity/Document: `*.document.ts` 또는 `*.entity.ts`
- Interface: `*.interface.ts`
- Constant: `*.constant.ts`
- Enum: `*.enum.ts`

### 3. 폴더 구조

```
src/
├── [feature]/
│   ├── api/              # Controller와 DTO
│   │   ├── [feature].controller.ts
│   │   ├── [feature].req.dto.ts
│   │   └── [feature].res.dto.ts
│   ├── application/      # Service (비즈니스 로직)
│   │   └── [feature].service.ts
│   ├── infrastructure/   # 외부 시스템 연동 (DB, API 등)
│   │   └── [feature].repository.ts
│   ├── interface/        # 인터페이스 정의
│   │   └── [feature].interface.ts
│   └── [feature].module.ts
└── common/               # 공통 모듈
    ├── api/
    ├── database/
    └── domain/
```

## 네이밍 규칙

### 1. 클래스명: PascalCase

```typescript
export class UserService {}
export class FileStorageS3 {}
export class MongooseTransactionInterceptor {}
```

### 2. 변수/함수명: camelCase

```typescript
const userId = '123';
function getUserById() {}
async createUser() {}
```

### 3. 상수: UPPER_SNAKE_CASE

```typescript
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;
```

### 4. 인터페이스: I 접두사 또는 PascalCase

```typescript
export interface IFileStorage {}
// 또는
export interface FileStorage {}
```

### 5. Enum: PascalCase, 값은 UPPER_SNAKE_CASE

```typescript
export enum AuthProvider {
  GOOGLE = 'GOOGLE',
  KAKAO = 'KAKAO',
  NAVER = 'NAVER',
}
```

## 코드 구조

### 1. Service 클래스

```typescript
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    // 구현
  }
}
```

### 2. Controller 클래스

```typescript
@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: '사용자 생성' })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }
}
```

### 3. Module 클래스

```typescript
@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

## Import 순서

1. NestJS/외부 라이브러리
2. 프로젝트 내부 모듈 (절대 경로 우선, 상대 경로는 하단)
3. 타입만 import 하는 경우는 마지막에

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from '../document/user.document';
import { CreateUserDto } from '../api/user.req.dto';
```

## 주석 규칙

### 1. JSDoc 주석 사용

```typescript
/**
 * 사용자를 생성합니다.
 * @param dto - 사용자 생성 정보
 * @returns 생성된 사용자
 */
async createUser(dto: CreateUserDto): Promise<User> {}
```

### 2. 복잡한 로직에는 인라인 주석

```typescript
// Workspace 이름 생성: ${startDate}~${endDate} ${destination} 여행
const workspaceName = `${startDate}~${endDate} ${destination} 여행`;
```

## 데코레이터 사용

### 1. 메서드 데코레이터 순서

```typescript
@Post()
@UseGuards(AuthGuard)
@ApiOperation({ summary: 'API 설명' })
@ApiOkResponse({ type: ResponseDto })
async handler(@Body() dto: RequestDto) {}
```

### 2. 커스텀 데코레이터는 명확하게

```typescript
@Transactional()
async createUser(dto: CreateUserDto) {}
```

## Error Handling

```typescript
try {
  // 작업 수행
} catch (error) {
  this.logger.error(`에러 발생: ${error.message}`, error.stack);
  throw new BadRequestException('적절한 에러 메시지');
}
```

## Logging

```typescript
private readonly logger = new Logger(UserService.name);

this.logger.log('작업 시작');
this.logger.warn('경고 메시지');
this.logger.error('에러 메시지', error.stack);
```

## 기타 규칙

1. **Private 필드**: `private readonly` 사용
2. **의존성 주입**: Constructor에서만 수행
3. **비동기 함수**: `async/await` 사용, Promise 직접 반환 지양
4. **타입 명시**: TypeScript 타입 명시적 사용
5. **DTO 검증**: class-validator 사용
