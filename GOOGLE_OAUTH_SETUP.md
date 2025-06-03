# Google OAuth 설정 가이드

## 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)로 이동
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보" 이동
4. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
5. 애플리케이션 유형: "웹 애플리케이션" 선택
6. 승인된 JavaScript 원본: `http://localhost:3000`
7. 승인된 리디렉션 URI: `http://localhost:3000/api/auth/callback/google`

## 2. 환경변수 설정

`.env.local` 파일 생성:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-random-string
GOOGLE_CLIENT_ID=your-google-client-id-from-console
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-console
```

## 3. NEXTAUTH_SECRET 생성

아래 명령어로 랜덤 시크릿 생성:

```bash
openssl rand -base64 32
```

## 4. 프로덕션 환경

프로덕션 배포시 리디렉션 URI 추가:
- `https://yourdomain.com/api/auth/callback/google`

그리고 `NEXTAUTH_URL`을 프로덕션 도메인으로 변경:
```env
NEXTAUTH_URL=https://yourdomain.com
```