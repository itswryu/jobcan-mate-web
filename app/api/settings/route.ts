import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { SettingsService } from '@/services/settings-service'
import { initializeDatabase } from '@/app/actions'

// 오류 처리를 개선한 API 라우트 핸들러
export async function GET() {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    try {
      // 설정 서비스를 통해 사용자 설정 조회
      let userSettings = await SettingsService.getSettingsByUserId(session.user.id)
      
      if (!userSettings) {
        // 사용자 설정이 없으면 기본 설정 생성
        userSettings = await SettingsService.createDefaultSettings(session.user.id)
      }
      
      return NextResponse.json({
        success: true,
        data: userSettings
      })
    } catch (dbError) {
      console.error('데이터베이스 오류:', dbError)
      
      // 데이터베이스 오류 발생 시 초기화 시도
      await initializeDatabase()
      
      // 기본 설정 반환
      return NextResponse.json({
        success: true,
        data: SettingsService.getDefaultSettings(),
        message: '데이터베이스 오류가 발생하여 기본 설정을 반환합니다. 다시 시도해 주세요.'
      })
    }
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
    
    try {
      // 설정 서비스를 통해 사용자 설정 저장
      await SettingsService.saveSettings(session.user.id, settings)
    } catch (dbError) {
      console.error('데이터베이스 저장 오류:', dbError)
      
      // 데이터베이스 오류 발생 시 초기화 시도
      await initializeDatabase()
      
      // 다시 저장 시도
      try {
        await SettingsService.saveSettings(session.user.id, settings)
      } catch (retryError) {
        console.error('재시도 중 오류:', retryError)
        return NextResponse.json(
          { success: false, message: '설정 저장에 실패했습니다. 다시 시도해 주세요.' },
          { status: 500 }
        )
      }
    }
    
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