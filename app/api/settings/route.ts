import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { SettingsService } from '@/services/settings-service'
import { initializeDatabase } from '@/app/db-actions'

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
      console.log('로그인 문제가 지속되면 데이터베이스 초기화를 시도해 주세요: npm run force-reset-db');
      
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

    console.log('POST /api/settings: 사용자 ID:', session.user.id);
    
    const settings = await request.json()
    console.log('POST /api/settings: 수신된 설정 데이터:', settings);
    
    // 설정 유효성 검사
    if (!settings.jobcanEmail || !settings.jobcanPassword) {
      console.log('POST /api/settings: 유효성 검사 실패 - 부족한 정보');
      return NextResponse.json(
        { success: false, message: 'Jobcan 계정 정보는 필수입니다.' },
        { status: 400 }
      )
    }
    
    try {
      // 설정 서비스를 통해 사용자 설정 저장
      console.log('POST /api/settings: SettingsService.saveSettings 호출 시작');
      const savedSettings = await SettingsService.saveSettings(session.user.id, settings);
      console.log('POST /api/settings: 설정 저장 성공:', savedSettings);
    } catch (dbError) {
      console.error('POST /api/settings: 데이터베이스 저장 오류:', dbError);
      console.log('로그인 문제가 지속되면 데이터베이스 초기화를 시도해 주세요: npm run force-reset-db');
      
      // 데이터베이스 오류 발생 시 초기화 시도
      console.log('POST /api/settings: 데이터베이스 초기화 시도');
      await initializeDatabase();
      
      // 다시 저장 시도
      try {
        console.log('POST /api/settings: 설정 저장 재시도');
        const retryResult = await SettingsService.saveSettings(session.user.id, settings);
        console.log('POST /api/settings: 재시도 성공:', retryResult);
      } catch (retryError) {
        console.error('POST /api/settings: 설정 저장 재시도 실패:', retryError);
        console.log('로그인 문제가 지속되면 데이터베이스 초기화를 시도해 주세요: npm run force-reset-db');
        return NextResponse.json(
          { success: false, message: '설정 저장에 실패했습니다. 다시 시도해 주세요.' },
          { status: 500 }
        )
      }
    }
    
    // 저장 후 사용자 설정 확인
    try {
      console.log('POST /api/settings: 저장 후 설정 확인');
      const verifySettings = await SettingsService.getSettingsByUserId(session.user.id);
      console.log('POST /api/settings: 확인 결과:', verifySettings);
    } catch (verifyError) {
      console.error('POST /api/settings: 설정 확인 오류:', verifyError);
    }
    
    return NextResponse.json({
      success: true,
      message: '설정이 저장되었습니다.'
    })
  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json(
      { success: false, message: '설정 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}