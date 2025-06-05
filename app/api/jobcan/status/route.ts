import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logInfo, logError } from '@/server/utils/logger';

/**
 * 현재 Jobcan 출근 상태를 확인하는 API
 * (참고: 실제 출근 상태를 확인하려면 Jobcan 사이트에 로그인하여 상태를 가져와야 함)
 * 현재는 임시 응답을 제공
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

    // 3. 현재 시간 및 요일 확인
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // 출근 시간 (지연 포함)
    const [checkInHour, checkInMinute] = settings.checkInTime.split(':').map(Number);
    const checkInTimeInMinutes = checkInHour * 60 + checkInMinute + (settings.checkInDelay || 0);

    // 퇴근 시간 (지연 포함)
    const [checkOutHour, checkOutMinute] = settings.checkOutTime.split(':').map(Number);
    const checkOutTimeInMinutes = checkOutHour * 60 + checkOutMinute + (settings.checkOutDelay || 0);

    // 4. 시간 기반으로 출근 상태 예측 (실제로는 Jobcan에서 상태를 가져와야 함)
    let estimatedStatus;

    if (currentTimeInMinutes < checkInTimeInMinutes) {
      // 출근 시간 전
      estimatedStatus = '미출근';
    } else if (currentTimeInMinutes < checkOutTimeInMinutes) {
      // 출근 시간 후, 퇴근 시간 전
      estimatedStatus = '근무중';
    } else {
      // 퇴근 시간 후
      estimatedStatus = '휴식중';
    }

    // 현재 요일이 주말이고 평일만 근무 설정이 되어있으면 미출근 상태로 설정
    const dayOfWeek = now.getDay(); // 0: 일요일, 6: 토요일
    if (settings.weekdaysOnly && (dayOfWeek === 0 || dayOfWeek === 6)) {
      estimatedStatus = '미출근';
    }

    // 5. 출근 상태 응답
    return NextResponse.json({
      success: true,
      status: estimatedStatus,
      message: '현재 출근 상태 추정 정보입니다. (실제 Jobcan 상태가 아닐 수 있습니다)'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    logError('출근 상태 확인 중 오류 발생:', errorMessage);

    return NextResponse.json(
      { success: false, message: `출근 상태 확인 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
