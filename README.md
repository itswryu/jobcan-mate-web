# Jobcan Mate Web

Jobcan 자동 출퇴근 관리 웹 서비스입니다.

## 기능

- ✅ **Google 소셜 로그인** (NextAuth.js)
- ✅ **사용자별 Jobcan 계정 설정**
- ✅ **자동 출퇴근 스케줄링 설정**
- ✅ **텔레그램 알림 연동**
- ✅ **연차 캘린더 연동**
- ✅ **반응형 웹 디자인**

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Google OAuth 설정 방법은 `GOOGLE_OAUTH_SETUP.md` 파일을 참조하세요.**

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 브라우저에서 접속
http://localhost:3000

## 프로젝트 구조

```
app/
├── api/
│   ├── auth/[...nextauth]/     # NextAuth.js 설정
│   ├── settings/               # 사용자 설정 API
│   └── jobcan/                # 출퇴근 처리 API
├── settings/                  # 설정 페이지
├── layout.tsx                 # 루트 레이아웃
└── page.tsx                   # 메인 페이지 (로그인)

components/
├── ui/                        # shadcn/ui 컴포넌트
├── header.tsx                 # 헤더 컴포넌트
├── login-form.tsx            # 로그인 폼
└── settings-form.tsx         # 설정 폼

lib/
├── auth.ts                   # 인증 유틸리티
└── utils.ts                  # 공통 유틸리티

providers/
└── session-provider.tsx      # NextAuth 세션 프로바이더
```

## 주요 설정 항목

### 계정 설정
- Jobcan 이메일/비밀번호
- 보안 입력 (비밀번호 표시/숨김)

### 근무 시간
- 출근/퇴근 시간 설정
- 평일만 자동 출퇴근 옵션
- 출근/퇴근 지연시간 (분 단위)
- 시간대 선택

### 알림 설정
- 텔레그램 봇 토큰 및 채팅 ID
- 연차 캘린더 URL (ICS 형식)
- 연차 키워드 설정

### 고급 설정
- 자동 스케줄링 활성화/비활성화
- 테스트 모드
- 메시지 언어 (한국어/영어/일본어)

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Authentication**: NextAuth.js (Google OAuth)
- **Icons**: Lucide React
- **State Management**: React Hooks

## 다음 개발 단계

- [ ] 데이터베이스 연동 (Supabase/PostgreSQL)
- [ ] 기존 Jobcan 자동화 로직 백엔드 서비스화
- [ ] 사용자별 스케줄링 시스템
- [ ] 출퇴근 기록 대시보드
- [ ] 실시간 알림 시스템

## 라이선스

MIT License