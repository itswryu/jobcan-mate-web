# Google 로그인 오류 해결 가이드

## 발생한 오류

```
POST /api/auth/signin/google 200 in 197ms
Error in signIn callback: PrismaClientKnownRequestError:
Invalid `prisma.user.findUnique()` invocation:
The table `main.User` does not exist in the current database.
```

이 오류는 Google 로그인 과정에서 데이터베이스의 `User` 테이블이 존재하지 않아 발생합니다.

## 문제 원인

1. 데이터베이스 마이그레이션이 실행되지 않음
2. 데이터베이스 파일 손상
3. Prisma 스키마와 데이터베이스 불일치

## 구현된 해결책

### 1. 자동 데이터베이스 초기화

앱 시작 시 데이터베이스 테이블의 존재 여부를 확인하고 필요한 경우 자동으로 초기화합니다. `lib/db-check.ts` 파일에 구현되어 있으며, `app/layout.tsx`에서 서버 사이드에서 실행됩니다.

### 2. 강화된 로그인 콜백

NextAuth의 `signIn` 콜백에서 오류 처리를 강화하여 데이터베이스 문제 발생 시 더 자세한 로그를 제공하고, 가능한 경우 오류를 복구하도록 수정했습니다.

### 3. 새로운 강제 리셋 스크립트

문제가 지속될 경우 데이터베이스를 완전히 초기화하는 스크립트를 추가했습니다:

```bash
npm run force-reset-db
```

이 스크립트는 다음과 같은 작업을 수행합니다:
- 기존 데이터베이스 파일 삭제
- 마이그레이션 디렉토리 삭제
- Prisma 스키마 유효성 검사
- 새 마이그레이션 생성 및 적용
- Prisma 클라이언트 재생성

## 수동 해결 방법

자동 해결이 실패하는 경우 다음 단계를 순서대로 시도해 보세요:

### 1. 데이터베이스 강제 리셋

```bash
npm run force-reset-db
```

### 2. 서버 재시작

```bash
npm run dev
```

### 3. 브라우저 캐시 및 쿠키 삭제

브라우저의 개발자 도구를 열고 Application 탭에서 다음을 수행합니다:
- Clear storage 기능 사용
- Cookies 삭제
- Local/Session Storage 비우기

### 4. 로그인 재시도

위 단계를 수행한 후 다시 로그인을 시도합니다.

## 오류 확인 방법

로그인 과정에서 더 자세한 오류 정보를 확인하려면 서버 콘솔 로그를 확인하세요. 다음과 같은 로그 메시지를 찾을 수 있습니다:

```
signIn callback: checking for existing user [user-id]
signIn callback: error finding user [error details]
```

이러한 메시지는 문제의 원인을 파악하는 데 도움이 됩니다.

## 데이터베이스 구조 확인

Prisma Studio를 사용하여 데이터베이스 구조와 내용을 확인할 수 있습니다:

```bash
npm run prisma:studio
```

이 명령어는 브라우저에서 Prisma Studio를 열고 데이터베이스 테이블과 데이터를 시각적으로 보여줍니다.

## 주의사항

- 데이터베이스 강제 리셋은 모든 데이터를 삭제합니다. 중요한 데이터가 있다면 백업을 먼저 수행하세요.
- 개발 환경에서만 이러한 방법을 사용하고, 프로덕션 환경에서는 데이터 마이그레이션 전략을 신중하게 계획해야 합니다.