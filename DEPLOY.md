# 배포 가이드

## GitHub Actions SSH 배포 설정

### 1. GitHub Secrets 설정

GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 Secrets를 추가하세요:

- `SERVER_HOST`: 서버 IP 주소 또는 도메인 (예: `123.456.789.0` 또는 `example.com`)
- `SERVER_USER`: SSH 사용자명 (예: `ubuntu`, `root`, `deploy`)
- `SSH_PRIVATE_KEY`: SSH 개인 키 (전체 내용)
- `SSH_PORT`: SSH 포트 (기본값: 22, 선택사항)
- `PROJECT_PATH`: 프로젝트 경로 (기본값: `/home/{SERVER_USER}/triply-backend`, 선택사항)

#### SSH 키 생성 방법

로컬에서 SSH 키를 생성하고 공개 키를 서버에 등록:

```bash
# SSH 키 생성 (이미 있으면 생략)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_deploy

# 공개 키를 서버에 복사
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub {SERVER_USER}@{SERVER_HOST}

# 개인 키 내용 확인 (GitHub Secrets에 등록할 내용)
cat ~/.ssh/github_actions_deploy
```

### 2. 서버 초기 설정

서버에 접속하여 다음을 설정하세요:

```bash
# 1. 프로젝트 디렉토리 생성
mkdir -p /home/{USER}/triply-backend
cd /home/{USER}/triply-backend

# 2. Git 저장소 클론
git clone https://github.com/{YOUR_USERNAME}/{YOUR_REPO}.git .

# 3. 환경 변수 파일 생성 (.env 또는 환경 변수로 설정)
# docker-compose.prod.yml에서 사용하는 환경 변수들:
# - MONGO_INITDB_ROOT_USERNAME
# - MONGO_INITDB_ROOT_PASSWORD
# - MONGODB_DB_NAME (선택사항, 기본값: triply)
# - PORT (선택사항, 기본값: 3000)

# 예시: .env 파일 생성
cat > .env << EOF
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your_secure_password
MONGODB_DB_NAME=triply
PORT=3000
EOF

# 4. Docker 및 Docker Compose 설치 확인
docker --version
docker-compose --version

# 5. 초기 배포 (수동)
docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. 자동 배포

이제 `master` 또는 `main` 브랜치에 코드를 push하면 자동으로 배포됩니다:

```bash
git push origin master
```

GitHub Actions에서 배포 진행 상황을 확인할 수 있습니다.

### 4. 배포 후 확인

```bash
# 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f app

# MongoDB 로그 확인
docker-compose -f docker-compose.prod.yml logs -f mongo
```

### 5. 문제 해결

#### 배포 실패 시

1. GitHub Actions 로그 확인
2. 서버에 직접 접속하여 수동 배포 시도:
   ```bash
   cd /path/to/project
   git pull origin master
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

#### 컨테이너가 시작되지 않는 경우

```bash
# 로그 확인
docker-compose -f docker-compose.prod.yml logs app

# 컨테이너 재시작
docker-compose -f docker-compose.prod.yml restart app
```

#### MongoDB 연결 오류

- 환경 변수 확인: `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`
- MongoDB 컨테이너 상태 확인: `docker-compose -f docker-compose.prod.yml ps mongo`
- 네트워크 확인: 두 컨테이너가 같은 네트워크(`internal-net`)에 있는지 확인

### 6. 수동 배포 명령어

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/triply-backend

# 최신 코드 가져오기
git pull origin master

# 기존 컨테이너 중지
docker-compose -f docker-compose.prod.yml down

# 새로 빌드 및 시작
docker-compose -f docker-compose.prod.yml up -d --build

# 상태 확인
docker-compose -f docker-compose.prod.yml ps
```

