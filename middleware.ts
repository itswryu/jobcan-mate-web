import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 미들웨어 함수
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Google 로그인 요청 시 로그 추가
  if (pathname.startsWith('/api/auth/signin/google')) {
    console.log('Google 로그인 요청 감지');
    // Edge 런타임에서는 데이터베이스 처리를 할 수 없으므로 이 부분 제거
  }
  
  // 응답 계속 진행
  return NextResponse.next();
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: [
    '/api/auth/signin/:path*',
    '/api/settings/:path*',
  ],
};
