# Jobcan Mate Web

Jobcan 자동 출퇴근 관리 웹 서비스입니다.

## 기능

- ✅ **Google 소셜 로그인** (NextAuth.js)
- ✅ **사용자별 Jobcan 계정 설정**
- ✅ **자동 출퇴근 스케줄링 설정**
- ✅ **텔레그램 알림 연동**
- ✅ **연차 캘린더 연동**
- ✅ **반응형 웹 디자인**
- ✅ **출퇴근 자동화 백엔드 서비스**
- ✅ **Playwright 기반 Jobcan 자동화**
- ✅ **사용자별 개인화된 출퇴근 스케줄링**
- ✅ **크론 작업 기반 자동 출퇴근**

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

## 수동 출퇴근 실행

개발 모드에서 수동으로 출퇴근을 실행하려면:

```bash
# 출근
npm run checkin

# 퇴근
npm run checkout
```

## 프로젝트 구조

```
app/
├── api/
│   ├── auth/[...nextauth]/     # NextAuth.js 설정
│   ├── settings/               # 사용자 설정 API
│   ├── jobcan/                 # 출퇴근 처리 API
│   └── cron/                   # 크론 작업 API
├── settings/                   # 설정 페이지
├── layout.tsx                  # 루트 레이아웃
└── page.tsx                    # 메인 페이지 (로그인)

components/
├── ui/                         # shadcn/ui 컴포넌트
├── header.tsx                  # 헤더 컴포넌트
├── login-form.tsx              # 로그인 폼
├── attendance-control.tsx      # 출퇴근 제어 컴포넌트
└── settings-form.tsx           # 설정 폼

server/
├── services/                   # 백엔드 서비스
│   ├── jobcanService.ts        # Jobcan 자동화 서비스
│   ├── calendarService.ts      # 캘린더 서비스
│   ├── messageService.ts       # 다국어 메시지 서비스
│   ├── notificationService.ts  # 알림 서비스
│   └── schedulerService.ts     # 스케줄러 서비스
└── utils/                      # 서버 유틸리티
    └── logger.ts               # 로깅 유틸리티

lib/
├── auth.ts                     # 인증 유틸리티
├── prisma.ts                   # Prisma 클라이언트
└── utils.ts                    # 공통 유틸리티

scripts/
├── manual-checkin.js           # 수동 출근 스크립트
└── manual-checkout.js          # 수동 퇴근 스크립트

providers/
└── session-provider.tsx        # NextAuth 세션 프로바이더
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

## 자동화 작동 방식

1. **사용자 설정 기반**: 각 사용자의 설정에 따라 출퇴근 시간과 지연 시간이 개인화됩니다.
2. **Playwright 브라우저 자동화**: Jobcan 사이트에 자동으로 로그인하고 출퇴근 버튼을 클릭합니다.
3. **크론 작업**: 5분마다 실행되는 크론 작업이 모든 사용자의 예약된 출퇴근 시간을 확인합니다.
4. **휴일 및 연차 감지**: 공휴일이나 연차 휴가일에는 자동으로 출퇴근 작업을 건너뜁니다.
5. **알림 시스템**: 텔레그램을 통해 출퇴근 성공 여부를 알립니다.

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Authentication**: NextAuth.js (Google OAuth)
- **Database**: Prisma ORM, SQLite
- **Automation**: Playwright
- **Scheduling**: Vercel Cron Jobs
- **Icons**: Lucide React
- **State Management**: React Hooks

## 사용된 주요 패키지

- `next`: 웹 프레임워크
- `next-auth`: 인증 시스템
- `@prisma/client`: 데이터베이스 ORM
- `playwright`: 브라우저 자동화
- `tailwindcss`: CSS 프레임워크
- `lucide-react`: 아이콘 라이브러리

## 배포 방법

Vercel을 통한 배포:

1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 배포 시 크론 작업 자동 설정됨 (vercel.json 파일)

## 다음 개발 단계

- [ ] 출퇴근 기록 대시보드 구현
- [ ] 복수 계정 관리 기능
- [ ] 모바일 앱 개발
- [ ] 다국어 지원 확장
- [ ] 다양한 출퇴근 시스템 지원

## 오류 해결 방법

### 데이터베이스 문제
```bash
npm run force-reset-db
```

### 브라우저 자동화 문제
1. 수동으로 테스트:
```bash
npm run checkin -- --debug
```
2. 브라우저 헤드리스 모드 비활성화:
```
// 설정에서 테스트 모드 활성화
```

### 알림 시스템 문제
1. 텔레그램 봇 토큰 및 채팅 ID 확인
2. 알림 로그 확인:
```bash
npm run dev > notification.log 2>&1
```

## 라이선스

MIT License
