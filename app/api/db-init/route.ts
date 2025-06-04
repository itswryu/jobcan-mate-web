import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { initializeDatabase, ensureDatabaseFile } from '@/app/db-actions';

// 데이터베이스 초기화 엔드포인트
export async function POST() {
  try {
    const session = await getAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 데이터베이스 파일 확인 및 생성
    console.log('API: 데이터베이스 파일 확인 및 생성 시작');
    const fileResult = await ensureDatabaseFile();
    console.log('API: 데이터베이스 파일 확인 결과:', fileResult);
    
    // 데이터베이스 초기화
    console.log('API: 데이터베이스 초기화 시작');
    const dbResult = await initializeDatabase();
    console.log('API: 데이터베이스 초기화 결과:', dbResult);
    
    return NextResponse.json({
      success: true,
      message: '데이터베이스가 성공적으로 초기화되었습니다.',
      fileResult,
      dbResult
    });
  } catch (error) {
    console.error('데이터베이스 초기화 API 오류:', error);
    
    // error를 unknown 타입에서 적절하게 처리
    const errorMessage = error instanceof Error 
      ? error.message 
      : '알 수 없는 오류가 발생했습니다.';
    
    return NextResponse.json(
      { 
        success: false, 
        message: '데이터베이스 초기화 중 오류가 발생했습니다.', 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
