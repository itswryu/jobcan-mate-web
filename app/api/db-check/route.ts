import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { diagnosticDb, directSaveSettings } from '@/lib/db-utils';
import { initializeDatabase } from '@/app/db-actions';

// 데이터베이스 상태 확인 엔드포인트
export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 디버그 모드 확인
    const params = new URL(request.url).searchParams;
    const isDebug = params.get('debug') === 'true';

    if (!isDebug) {
      return NextResponse.json({
        success: false,
        message: '디버그 모드에서만 사용 가능한 기능입니다.'
      }, { status: 403 });
    }

    // 데이터베이스 진단 실행 (디버그 모드일 때만)
    const diagnosticResult = await diagnosticDb();
    
    return NextResponse.json({
      success: true,
      data: diagnosticResult
    });
  } catch (error) {
    console.error('DB 진단 오류:', error);
    return NextResponse.json(
      { success: false, message: '데이터베이스 진단 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 직접 설정 저장 엔드포인트
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 디버그 모드 확인
    const params = new URL(request.url).searchParams;
    const isDebug = params.get('debug') === 'true';

    if (!isDebug) {
      return NextResponse.json({
        success: false,
        message: '디버그 모드에서만 사용 가능한 기능입니다.'
      }, { status: 403 });
    }

    // 설정 데이터 파싱
    const settings = await request.json();
    console.log('POST /api/db-check: 설정 저장 요청 데이터:', settings);
    
    // 설정 유효성 검사
    if (!settings.jobcanEmail || !settings.jobcanPassword) {
      return NextResponse.json(
        { success: false, message: 'Jobcan 계정 정보는 필수입니다.' },
        { status: 400 }
      );
    }
    
    try {
      // 데이터베이스 초기화 (문제가 있을 수 있으므로)
      await initializeDatabase();
      
      // 직접 설정 저장
      const result = await directSaveSettings(session.user.id, settings);
      
      // 저장 후 데이터베이스 진단
      const diagnosticResult = await diagnosticDb();
      
      return NextResponse.json({
        success: true,
        message: '설정이 저장되었습니다.',
        data: result,
        diagnostic: diagnosticResult
      });
    } catch (error) {
      console.error('직접 설정 저장 중 오류:', error);
      return NextResponse.json(
        { success: false, message: '설정 저장에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('POST 요청 처리 중 오류:', error);
    return NextResponse.json(
      { success: false, message: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}