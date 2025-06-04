import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { JobcanService } from '@/server/services/jobcanService';
import { SchedulerService } from '@/server/services/schedulerService';
import { prisma } from '@/lib/prisma';
import { logInfo, logError, logSuccess } from '@/server/utils/logger';

/**
 * Jobcan 출퇴근 처리 API
 * 사용자의 설정을 기반으로 출퇴근 처리를 실행합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 사용자 인증 확인
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }
    
    // 2. 요청 데이터 파싱
    const { action } = await request.json();
    
    if (!action || !['checkIn', 'checkOut', 'auto'].includes(action)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 작업 유형입니다. "checkIn", "checkOut" 또는 "auto"를 사용하세요.' },
        { status: 400 }
      );
    }

    logInfo(`사용자 ${session.user.id}가 ${action} 작업을 요청했습니다.`);
    
    // 3. 출퇴근 작업 실행
    const result = await SchedulerService.executeForUser(session.user.id, action as any);
    
    // 4. 결과 반환
    if (result.success) {
      logSuccess(`사용자 ${session.user.id}의 ${action} 작업이 성공적으로 완료되었습니다.`);
    } else {
      logError(`사용자 ${session.user.id}의 ${action} 작업이 실패했습니다: ${result.message}`);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    logError('Jobcan API 처리 중 오류 발생:', errorMessage);
    
    return NextResponse.json(
      { success: false, message: `처리 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * 사용자의 출퇴근 상태를 확인하는 API
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 사용자 인증 확인
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }
    
    // 2. 사용자 설정 가져오기
    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id }
    });
    
    if (!settings) {
      return NextResponse.json(
        { 
          success: false, 
          message: '사용자 설정을 찾을 수 없습니다. 설정 페이지에서 Jobcan 계정 정보를 설정해주세요.' 
        },
        { status: 404 }
      );
    }
    
    // 3. 현재 시간 기준으로 다음 예정된 작업 정보 계산
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // 출근 시간 (지연 포함)
    const [checkInHour, checkInMinute] = settings.checkInTime.split(':').map(Number);
    const checkInTimeInMinutes = checkInHour * 60 + checkInMinute + (settings.checkInDelay || 0);
    const checkInDateTime = new Date(now);
    checkInDateTime.setHours(Math.floor(checkInTimeInMinutes / 60));
    checkInDateTime.setMinutes(checkInTimeInMinutes % 60);
    checkInDateTime.setSeconds(0);
    
    // 퇴근 시간 (지연 포함)
    const [checkOutHour, checkOutMinute] = settings.checkOutTime.split(':').map(Number);
    const checkOutTimeInMinutes = checkOutHour * 60 + checkOutMinute + (settings.checkOutDelay || 0);
    const checkOutDateTime = new Date(now);
    checkOutDateTime.setHours(Math.floor(checkOutTimeInMinutes / 60));
    checkOutDateTime.setMinutes(checkOutTimeInMinutes % 60);
    checkOutDateTime.setSeconds(0);
    
    // 4. 스케줄러 상태 정보 반환
    const schedulerEnabled = settings.schedulerEnabled;
    const nextAction = currentTimeInMinutes < checkInTimeInMinutes 
      ? 'checkIn' 
      : currentTimeInMinutes < checkOutTimeInMinutes 
        ? 'checkOut' 
        : 'checkIn'; // 다음 날 출근
    
    const nextActionTime = nextAction === 'checkIn' 
      ? (currentTimeInMinutes < checkInTimeInMinutes ? checkInDateTime : new Date(checkInDateTime.getTime() + 86400000)) // 다음 날
      : checkOutDateTime;
    
    return NextResponse.json({
      success: true,
      data: {
        schedulerEnabled,
        checkInTime: checkInDateTime.toISOString(),
        checkOutTime: checkOutDateTime.toISOString(),
        nextAction,
        nextActionTime: nextActionTime.toISOString(),
        isWeekdaysOnly: settings.weekdaysOnly,
        testMode: settings.testMode
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    logError('Jobcan 상태 확인 중 오류 발생:', errorMessage);
    
    return NextResponse.json(
      { success: false, message: `처리 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
