# Edge 런타임 오류 해결 가이드

## 발생한 오류

```
Error: The edge runtime does not support Node.js 'child_process' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
```

이 오류는 Next.js의 미들웨어(Edge 런타임)에서 Node.js 전용 모듈인 'child_process'를 사용하려고 했기 때문에 발생했습니다.

## 문제 원인

Next.js의 미들웨어는 Edge 런타임에서 실행되며, 이 환경에서는 다음과 같은 제한이 있습니다:

1. Node.js 전용 모듈 사용 불가 (`fs`, `child_process` 등)
2. 데이터베이스 연결 불가 (Edge 환경에서는 직접 DB 접근 불가)
3. 무거운 연산 불가 (Edge 런타임은 경량 환경)

## 구현된 해결책

### 1. 미들웨어 수정 (`middleware.ts`)

미들웨어에서 데이터베이스 초기화 로직을 제거하고, 단순 로깅으로 대체했습니다.

```typescript
// 수정 전
if (pathname.startsWith('/api/auth/signin/google')) {
  console.log('Google 로그인 요청 감지: 데이터베이스 상태 확인 중...');
  const dbStatus = await checkDatabase();
  // ...
}

// 수정 후
if (pathname.startsWith('/api/auth/signin/google')) {
  console.log('Google 로그인 요청 감지');
  // Edge 런타임에서는 데이터베이스 처리를 할 수 없으므로 이 부분 제거
}
```

### 2. 서버 액션 구현 (`app/actions.ts`)

데이터베이스 초기화 로직을 서버 액션으로 분리했습니다. 서버 액션은 Edge 런타임이 아닌 Node.js 환경에서 실행되므로, `child_process` 같은 Node.js 모듈을 사용할 수 있습니다.

```typescript
'use server'

export async function initializeDatabase() {
  // Node.js 모듈을 사용하는 데이터베이스 초기화 로직
  // ...
}
```

### 3. 레이아웃 수정 (`app/layout.tsx`)

레이아웃에서 새로 구현된 서버 액션을 호출하도록 변경했습니다.

```typescript
// 수정 전
checkDatabase()
  .then((result) => {
    console.log('데이터베이스 초기화 결과:', result ? '성공' : '실패');
  })

// 수정 후
initializeDatabase().catch(error => {
  console.error('데이터베이스 초기화 중 오류:', error);
});
```

### 4. 로그인 콜백 강화 (`lib/auth.ts`)

로그인 과정에서 데이터베이스 오류가 발생할 경우, 서버 액션을 동적으로 import하여 데이터베이스 초기화를 시도하도록 수정했습니다.

```typescript
try {
  existingUser = await prisma.user.findUnique({
    where: { id: user.id as string },
  });
} catch (findError) {
  console.error('signIn callback: error finding user', findError);
  
  // 테이블이 없는 경우 서버 액션을 통해 데이터베이스 초기화 시도
  const { initializeDatabase } = await import('@/app/actions');
  await initializeDatabase();
  
  // 새로 생성될 사용자로 처리
  existingUser = null;
}
```

### 5. API 라우트 개선 (`app/api/settings/route.ts`)

API 라우트에서도 데이터베이스 오류 발생 시 초기화를 시도하도록 예외 처리를 추가했습니다.

```typescript
try {
  // 설정 서비스를 통해 사용자 설정 조회
  let userSettings = await SettingsService.getSettingsByUserId(session.user.id)
} catch (dbError) {
  console.error('데이터베이스 오류:', dbError)
  
  // 데이터베이스 오류 발생 시 초기화 시도
  await initializeDatabase()
  
  // 기본 설정 반환
  // ...
}
```

## Next.js의 Edge와 Node.js 런타임 차이점

Next.js에서는 코드가 실행되는 환경에 따라 두 가지 런타임이 있습니다:

### Edge 런타임

- **사용되는 곳**: 미들웨어, Edge API 라우트
- **특징**: 더 빠르게 시작, 전 세계 엣지 서버에서 실행 가능
- **제한사항**: Node.js 모듈 사용 불가, 파일 시스템 접근 불가, DB 연결 제한

### Node.js 런타임

- **사용되는 곳**: 서버 컴포넌트, API 라우트, 서버 액션
- **특징**: 전체 Node.js 기능 사용 가능
- **제한사항**: 시작 시간이 Edge 런타임보다 느림

## 오류 발생 시 조치 방법

이 변경 후에도 오류가 계속 발생한다면 다음 단계를 시도해 보세요:

1. 애플리케이션 재시작:
   ```bash
   npm run dev
   ```

2. 브라우저 캐시 및 쿠키 삭제 후 다시 시도

3. 데이터베이스 강제 리셋 실행:
   ```bash
   npm run force-reset-db
   ```

4. 오류 메시지 확인:
   - Edge 런타임 오류: 미들웨어에서 Node.js 모듈 사용 시도
   - DB 연결 오류: 테이블 누락 또는 스키마 불일치

## 코드 구조 모범 사례

### Edge 런타임에서 안전하게 사용할 수 있는 코드:
- Web API (fetch, Request, Response)
- 일반 JavaScript 로직
- Next.js의 내장 함수 (NextResponse 등)

### Node.js 런타임으로 분리해야 하는 코드:
- 데이터베이스 연결 및 쿼리
- 파일 시스템 작업
- 외부 프로세스 실행 (child_process)
- 무거운 계산 작업

이러한 구분을 통해 Edge 런타임과 Node.js 런타임 간의 호환성 문제를 방지할 수 있습니다.