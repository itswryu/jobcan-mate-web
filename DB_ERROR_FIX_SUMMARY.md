# Google 로그인 문제 해결 및 데이터베이스 안정성 개선

## 발생한 문제

```
POST /api/auth/signin/google 200 in 197ms
Error in signIn callback: PrismaClientKnownRequestError:
Invalid `prisma.user.findUnique()` invocation:
The table `main.User` does not exist in the current database.
```

이 오류는 Google 로그인 과정에서 데이터베이스의 `User` 테이블이 존재하지 않아 발생하는 문제입니다.

## 구현된 해결책

### 1. 자동 데이터베이스 초기화 (`lib/db-check.ts`)

앱 시작 시 데이터베이스 테이블의 존재 여부를 확인하고 필요한 경우 자동으로 초기화합니다.

```typescript
// app/layout.tsx에서 호출
checkDatabase()
  .then((result) => {
    console.log('데이터베이스 초기화 결과:', result ? '성공' : '실패');
  })
```

### 2. API 미들웨어 추가 (`middleware.ts`)

로그인 요청 시 데이터베이스 상태를 확인하고 문제가 있으면 자동으로 초기화를 시도합니다.

```typescript
// Google 로그인 요청 시 데이터베이스 확인
if (pathname.startsWith('/api/auth/signin/google')) {
  console.log('Google 로그인 요청 감지: 데이터베이스 상태 확인 중...');
  await checkDatabase();
}
```

### 3. 강화된 로그인 콜백 (`lib/auth.ts`)

NextAuth의 `signIn` 콜백에서 오류 처리를 강화하여 데이터베이스 문제 발생 시 더 자세한 로그를 제공하고, 가능한 경우 오류를 복구합니다.

```typescript
async signIn({ user, account, profile }) {
  // 상세 로깅 추가
  console.log('signIn callback: checking for existing user', user.id);
  
  try {
    // 예외 처리 강화
    // ...
  } catch (error) {
    console.error('Error in signIn callback:', error);
    return false;
  }
}
```

### 4. 강제 데이터베이스 리셋 스크립트 (`scripts/force-reset-db.js`)

데이터베이스를 완전히 초기화하는 스크립트를 추가했습니다:

```bash
npm run force-reset-db
```

### 5. 개선된 오류 UI (`components/login-form.tsx`)

로그인 실패 시 사용자에게 더 명확한 오류 메시지와 해결 방법을 제공합니다.

```tsx
{error && (
  <Alert variant="destructive" className="mb-4 w-full">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>로그인 오류</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
    <div className="mt-2 text-xs">
      <p>다음 해결 방법을 시도해 보세요:</p>
      <ul className="list-disc pl-5 mt-1">
        <li>브라우저를 새로고침 한 후 다시 시도</li>
        <li>쿠키 및 캐시 삭제 후 다시 시도</li>
        <li>다른 브라우저로 시도</li>
      </ul>
    </div>
  </Alert>
)}
```

## 사용 방법

### 자동 복구

이제 데이터베이스 문제가 발생하면 자동으로 감지하고 해결을 시도합니다. 대부분의 경우 사용자 개입 없이 문제가 해결됩니다.

### 수동 복구

자동 복구가 실패한 경우:

1. 데이터베이스 강제 리셋:
   ```bash
   npm run force-reset-db
   ```

2. 서버 재시작:
   ```bash
   npm run dev
   ```

3. 브라우저 캐시 및 쿠키 삭제 후 다시 로그인

## 변경된 파일

1. `/lib/db-check.ts` - 데이터베이스 상태 확인 및 초기화 유틸리티
2. `/lib/auth.ts` - 강화된 로그인 콜백 처리
3. `/middleware.ts` - API 요청 시 데이터베이스 확인
4. `/app/layout.tsx` - 앱 시작 시 데이터베이스 초기화
5. `/components/login-form.tsx` - 개선된 오류 UI
6. `/components/ui/alert.tsx` - 오류 알림 컴포넌트
7. `/scripts/force-reset-db.js` - 강제 데이터베이스 리셋 스크립트
8. `/app/error/page.tsx` - 오류 페이지
9. `/LOGIN_ERROR_FIX.md` - 문제 해결 가이드

## 추가 정보

자세한 문제 해결 방법은 `LOGIN_ERROR_FIX.md` 파일을 참조하세요.
