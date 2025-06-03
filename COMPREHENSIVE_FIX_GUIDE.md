# Google 로그인 및 데이터베이스 문제 종합 해결 가이드

이 문서는 Jobcan Mate Web 프로젝트에서 발생한 다양한 문제들과 해결 방법을 정리한 종합 가이드입니다.

## 발생한 주요 문제

1. **데이터베이스 테이블 없음 오류**
   ```
   PrismaClientKnownRequestError:
   Invalid `prisma.user.findUnique()` invocation:
   The table `main.User` does not exist in the current database.
   ```

2. **Edge 런타임 오류**
   ```
   Error: The edge runtime does not support Node.js 'child_process' module.
   Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
   ```

3. **헤더 전송 후 추가 오류**
   ```
   Error [ERR_HTTP_HEADERS_SENT]: Cannot append headers after they are sent to the client
   ```

## 해결 전략 요약

### 1. Next.js 런타임 분리

- **Edge 런타임**: 미들웨어 - 경량 로직만 포함
- **Node.js 런타임**: 서버 액션, API 라우트 - 데이터베이스 및 파일 시스템 작업 포함

### 2. 자동 데이터베이스 복구

- 서버 시작 시 데이터베이스 상태 확인
- 로그인 과정에서 오류 발생 시 자동 초기화
- API 호출 시 오류 복구 메커니즘 적용

### 3. 견고한 오류 처리

- 단계별 오류 포착 및 복구
- 자세한 로그 기록
- 사용자 친화적인 오류 메시지

## 주요 변경 파일

1. **미들웨어** (`middleware.ts`)
   - Edge 런타임 호환 코드로 변경
   - 데이터베이스 로직 제거

2. **서버 액션** (`app/actions.ts`)
   - 데이터베이스 초기화 로직 구현
   - 전체 Node.js 기능 활용 가능

3. **로그인 콜백** (`lib/auth.ts`)
   - 데이터베이스 오류 발생 시 복구 시도
   - 상세한 로그 추가

4. **API 라우트** (`app/api/settings/route.ts`)
   - 다중 레벨 오류 처리
   - 자동 복구 메커니즘 추가

5. **레이아웃** (`app/layout.tsx`)
   - 서버 액션을 통한 초기화 실행

## 문제별 해결 방법

### 데이터베이스 테이블 없음 오류

1. **자동 감지 및 초기화**:
   ```typescript
   try {
     await prisma.user.count();
   } catch (error) {
     // 테이블이 없는 경우 마이그레이션 실행
     await execAsync('npx prisma migrate dev --name init');
   }
   ```

2. **로그인 과정 중 복구**:
   ```typescript
   catch (findError) {
     // 테이블이 없는 경우 서버 액션을 통해 초기화
     const { initializeDatabase } = await import('@/app/actions');
     await initializeDatabase();
   }
   ```

### Edge 런타임 오류

1. **미들웨어 단순화**:
   ```typescript
   // 변경 전
   if (pathname.startsWith('/api/auth/signin/google')) {
     await checkDatabase(); // 오류 발생
   }

   // 변경 후
   if (pathname.startsWith('/api/auth/signin/google')) {
     console.log('Google 로그인 요청 감지'); // 단순 로깅
   }
   ```

2. **서버 액션 활용**:
   ```typescript
   'use server'
   // Node.js 전용 모듈 사용 가능
   import { exec } from 'child_process';
   import fs from 'fs';
   ```

### 헤더 전송 오류

API 라우트에서 응답을 여러 번 보내는 문제를 방지하기 위해:

```typescript
try {
  // 작업 수행
  return NextResponse.json({ success: true });
} catch (error) {
  // 오류 처리
  return NextResponse.json({ success: false });
}
```

## 사용 방법

### 자동 복구

대부분의 경우 시스템이 자동으로 데이터베이스 문제를 감지하고 복구합니다.

### 수동 복구 (필요한 경우)

1. **데이터베이스 강제 리셋**:
   ```bash
   npm run force-reset-db
   ```

2. **서버 재시작**:
   ```bash
   npm run dev
   ```

3. **브라우저 캐시 및 쿠키 삭제 후 다시 로그인**

## 개발 모범 사례

### 1. Next.js 런타임 이해

- **Edge 런타임**: 미들웨어, Edge API 라우트
- **Node.js 런타임**: 서버 컴포넌트, API 라우트, 서버 액션

### 2. 단계별 오류 처리

```typescript
try {
  // 주요 로직
} catch (error) {
  // 상세 로그
  console.error('오류 상세 정보:', error);
  
  // 복구 시도
  try {
    // 복구 로직
  } catch (recoveryError) {
    // 복구 실패 처리
  }
  
  // 적절한 응답
}
```

### 3. 런타임 분리 예시

```typescript
// 미들웨어 (Edge 런타임)
export function middleware(request) {
  // 경량 로직만 포함
  console.log('요청 감지');
  return NextResponse.next();
}

// 서버 액션 (Node.js 런타임)
'use server'
export async function processData() {
  // 무거운 작업 수행
  const { exec } = require('child_process');
  await new Promise(resolve => exec('some-command', resolve));
}
```

## 관련 문서

- [EDGE_RUNTIME_FIX.md](./EDGE_RUNTIME_FIX.md) - Edge 런타임 오류 해결 가이드
- [LOGIN_ERROR_FIX.md](./LOGIN_ERROR_FIX.md) - 로그인 오류 해결 가이드
- [DB_TEST_README.md](./DB_TEST_README.md) - 데이터베이스 테스트 가이드

---

이 문서는 향후 유사한 문제가 발생할 경우 참조할 수 있는 종합 가이드입니다. 프로젝트 특성에 따라 추가적인 문제 해결 방법을 계속 업데이트하는 것이 좋습니다.
