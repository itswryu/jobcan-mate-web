import { prisma } from '../lib/prisma';

/**
 * 설정 서비스 클래스
 * 사용자 설정 관련 데이터베이스 작업을 처리합니다.
 */
export class SettingsService {
  /**
   * 사용자 ID로 설정을 조회합니다.
   * @param userId 사용자 ID
   * @returns 설정 객체 또는 null
   */
  static async getSettingsByUserId(userId: string) {
    try {
      return await prisma.settings.findUnique({
        where: { userId }
      });
    } catch (error) {
      console.error('설정 조회 중 오류:', error);
      throw new Error('설정을 조회하는 중에 오류가 발생했습니다.');
    }
  }
  
  /**
   * 사용자 설정을 저장하거나 업데이트합니다.
   * @param userId 사용자 ID
   * @param settings 설정 데이터
   * @returns 저장된 설정 객체
   */
  static async saveSettings(userId: string, settings: any) {
    try {
      console.log('설정 저장 시작:', { userId, settings });
      
      const existingSettings = await prisma.settings.findUnique({
        where: { userId }
      });
      
      console.log('기존 설정 조회 결과:', existingSettings ? '존재함' : '존재하지 않음');
      
      let result;
      if (existingSettings) {
        // 설정 업데이트
        console.log('설정 업데이트 시작');
        result = await prisma.settings.update({
          where: { userId },
          data: settings
        });
        console.log('설정 업데이트 완료:', result);
      } else {
        // 새 설정 생성
        console.log('새 설정 생성 시작');
        result = await prisma.settings.create({
          data: {
            userId,
            ...settings
          }
        });
        console.log('새 설정 생성 완료:', result);
      }
      
      return result;
    } catch (error) {
      console.error('설정 저장 중 오류:', error);
      throw new Error('설정을 저장하는 중에 오류가 발생했습니다.');
    }
  }
  
  /**
   * 사용자 설정이 존재하는지 확인합니다.
   * @param userId 사용자 ID
   * @returns 설정 존재 여부
   */
  static async hasSettings(userId: string): Promise<boolean> {
    try {
      const count = await prisma.settings.count({
        where: { userId }
      });
      
      return count > 0;
    } catch (error) {
      console.error('설정 확인 중 오류:', error);
      return false;
    }
  }
  
  /**
   * 기본 설정 객체를 생성합니다.
   * @returns 기본 설정 객체
   */
  static getDefaultSettings() {
    return {
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
    };
  }
  
  /**
   * 사용자 기본 설정을 생성합니다.
   * @param userId 사용자 ID
   * @returns 생성된 설정 객체
   */
  static async createDefaultSettings(userId: string) {
    try {
      // 이미 설정이 있는지 확인
      const existingSettings = await prisma.settings.findUnique({
        where: { userId }
      });
      
      if (existingSettings) {
        return existingSettings;
      }
      
      // 기본 설정 생성
      return await prisma.settings.create({
        data: {
          userId,
          ...this.getDefaultSettings()
        }
      });
    } catch (error) {
      console.error('기본 설정 생성 중 오류:', error);
      throw new Error('기본 설정을 생성하는 중에 오류가 발생했습니다.');
    }
  }
}
