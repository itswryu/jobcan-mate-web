# SQLite 데이터베이스 테스트 및 문제 해결 가이드

이 문서는 Jobcan Mate Web의 SQLite 데이터베이스 연동과 관련된 테스트 및 문제 해결 방법을 설명합니다.

## 발생 가능한 오류

```
Invalid `prisma.settings.findUnique()` invocation:
The table `main.Settings` does not exist in the current database.
```

이 오류는 다음과 같은 원인으로 발생할 수 있습니다:
1. 마이그레이션이 실행되지 않음
2. 데이터베이스 파일 손상
3. 스키마와 데이터베이스 불일치

## 해결 방법

### 1. 데이터베이스 수정 스크립트 실행

데이터베이스 문제를 자동으로 감지하고 수정하는 스크립트를 실행합니다:

```bash
npm run fix-db
```

이 스크립트는 다음 작업을 수행합니다:
- 필요한 테이블의 존재 여부 확인
- 테이블이 없는 경우 데이터베이스 파일 삭제 및 재생성
- 마이그레이션 실행 및 Prisma 클라이언트 생성

### 2. 데이터베이스 리셋

문제가 지속되면 데이터베이스를 완전히 리셋합니다:

```bash
npm run reset-db
```

이 스크립트는 다음 작업을 수행합니다:
- 마이그레이션 리셋 (`prisma migrate reset --force`)
- 새 마이그레이션 생성 (`prisma migrate dev --name init`)
- Prisma 클라이언트 재생성

### 3. 종합 테스트 실행

데이터베이스 연동을 자세히 테스트하려면 다음 명령어를 실행합니다:

```bash
npm run test:all
```

이 스크립트는 다음 테스트를 순차적으로 실행합니다:
1. 데이터베이스 확인 및 수정
2. 스키마 테스트
3. 서비스 로직 테스트
4. API 엔드포인트 테스트
5. 웹 UI 저장 테스트

## 개별 테스트

특정 부분만 테스트하려면 다음 명령어를 사용할 수 있습니다:

```bash
# 스키마 테스트
npm run test:schema

# 서비스 로직 테스트
npm run test:service

# API 엔드포인트 테스트
npm run test:api

# 웹 UI 데이터베이스 저장 테스트
npm run test:db
```

## 테스트 내용 설명

### 스키마 테스트 (`schema.test.ts`)
- 마이그레이션 상태 확인
- 데이터베이스 모델 구조 확인
- 필수 필드 존재 여부 확인

### 서비스 로직 테스트 (`settings-service.test.ts`)
- 기본 설정 생성 테스트
- 설정 조회 테스트
- 설정 저장 테스트
- 설정 존재 여부 확인 테스트

### API 엔드포인트 테스트 (`api.test.ts`)
- 설정 API 엔드포인트 직접 호출 테스트
- 인증 없이 호출 시 401 응답 확인

### 웹 UI 데이터베이스 저장 테스트 (`db-save.test.ts`)
- 직접 API 호출로 설정 저장 테스트
- 웹 인터페이스를 통한 설정 저장 테스트

## 데이터베이스 구조

```prisma
model User {
  id        String   @id
  email     String   @unique
  name      String?
  image     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  settings  Settings?
}

model Settings {
  id                    Int     @id @default(autoincrement())
  userId                String  @unique
  user                  User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Jobcan 계정 정보
  jobcanEmail           String
  jobcanPassword        String
  
  // 근무 시간 설정
  weekdaysOnly          Boolean @default(true)
  checkInTime           String  @default("09:00")
  checkOutTime          String  @default("18:00")
  
  // 스케줄러 설정
  schedulerEnabled      Boolean @default(true)
  checkInDelay          Int     @default(-10)
  checkOutDelay         Int     @default(5)
  timezone              String  @default("Asia/Seoul")
  
  // 고급 설정
  testMode              Boolean @default(false)
  messageLanguage       String  @default("ko")
  
  // 알림 설정
  telegramBotToken      String  @default("")
  telegramChatId        String  @default("")
  annualLeaveCalendarUrl String  @default("")
  annualLeaveKeyword    String  @default("연차")
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

## 구현된 개선사항

1. **서비스 계층 추가**:
   - `SettingsService` 클래스를 통한 비즈니스 로직 분리
   - 코드 재사용성 및 테스트 용이성 향상

2. **자동화된 테스트**:
   - Playwright를 활용한 통합 테스트
   - 각 구성 요소별 개별 테스트
   - 문제 감지 및 자동 수정 스크립트

3. **에러 처리 개선**:
   - 데이터베이스 오류 감지 및 복구
   - 사용자 설정 자동 생성
   - 상세한 오류 메시지 및 로깅

4. **코드 구조 개선**:
   - API 라우트 간소화
   - 서비스 로직 모듈화
   - 테스트 용이성 향상

## 테스트 환경 설정

Playwright 테스트를 실행하기 위해 브라우저를 설치해야 합니다:

```bash
npm run install-pw
```

이 명령어는 필요한 Playwright 브라우저 및 의존성을 설치합니다.
