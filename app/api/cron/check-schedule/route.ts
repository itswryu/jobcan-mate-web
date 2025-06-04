import { NextResponse } from 'next/server';
import { SchedulerService } from '@/server/services/schedulerService';
import { logInfo, logError, logSuccess } from '@/server/utils/logger';

/**
 * 모든 사용자의 예약된 출퇴근 작업을 확인하고 실행하는 크론 API
 * 이 API는 Vercel Cron 또는 외부 크론 서비스에서 호출됩니다.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 최대 실행 시간 5분

export async function GET() {
  try {
    logInfo('크론 작업 시작: 모든 사용자의 예약된 출퇴근 작업 확인');
    
    const startTime = Date.now();
    await SchedulerService.checkAndExecuteForAllUsers();
    const duration = Date.now() - startTime;
    
    logSuccess(`크론 작업 완료. 소요 시간: ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: '크론 작업이 성공적으로 완료되었습니다.',
      duration: `${duration}ms`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    logError('크론 작업 처리 중 오류 발생:', errorMessage);
    
    return NextResponse.json(
      { success: false, message: `크론 작업 처리 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
