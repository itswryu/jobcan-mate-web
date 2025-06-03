import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자 설정 조회 로직
    // 데이터베이스에서 사용자별 설정 조회
    const defaultSettings = {
      jobcanEmail: '',
      jobcanPassword: '',
      weekdaysOnly: true,
      checkInTime: '09:00',
      checkOutTime: '18:00',
      schedulerEnabled: true,
      checkInDelay: -10,
      checkOutDelay: 5,
      timezone: 'Asia/Seoul',
      testMode: false,
      messageLanguage: 'ko',
      telegramBotToken: '',
      telegramChatId: '',
      annualLeaveCalendarUrl: '',
      annualLeaveKeyword: '연차'
    }
    
    return NextResponse.json({
      success: true,
      data: defaultSettings
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { success: false, message: '설정 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const settings = await request.json()
    
    // 설정 유효성 검사
    if (!settings.jobcanEmail || !settings.jobcanPassword) {
      return NextResponse.json(
        { success: false, message: 'Jobcan 계정 정보는 필수입니다.' },
        { status: 400 }
      )
    }
    
    // 설정 저장 로직
    // 데이터베이스에 사용자별 설정 저장
    // const userId = session.user.id
    // await saveUserSettings(userId, settings)
    
    console.log('Settings to save:', { userId: session.user.id, settings })
    
    return NextResponse.json({
      success: true,
      message: '설정이 저장되었습니다.'
    })
  } catch (error) {
    console.error('Settings save error:', error)
    return NextResponse.json(
      { success: false, message: '설정 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}