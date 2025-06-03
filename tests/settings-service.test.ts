import { test, expect } from '@playwright/test';
import { SettingsService } from '../services/settings-service';
import { PrismaClient } from '@prisma/client';

// 테스트용 계정 정보
const TEST_USER_ID = 'test-service-user-id';
const TEST_USER_EMAIL = 'test-service@example.com';

// Prisma 클라이언트 초기화
const prisma = new PrismaClient();

// 테스트 실행
test.describe('설정 서비스 테스트', () => {
  
  test.beforeAll(async () => {
    // 테스트 사용자 설정
    try {
      // 기존 테스트 사용자가 있으면 삭제
      await prisma.settings.deleteMany({
        where: { userId: TEST_USER_ID }
      });
      
      await prisma.user.deleteMany({
        where: { id: TEST_USER_ID }
      });
      
      // 테스트 사용자 생성
      await prisma.user.create({
        data: {
          id: TEST_USER_ID,
          email: TEST_USER_EMAIL,
          name: 'Test Service User',
        }
      });
      
      console.log('테스트 사용자가 생성되었습니다:', TEST_USER_ID);
    } catch (error) {
      console.error('테스트 사용자 설정 중 오류:', error);
      throw error;
    }
  });
  
  test('기본 설정 생성 테스트', async () => {
    // 기본 설정 생성
    const defaultSettings = await SettingsService.createDefaultSettings(TEST_USER_ID);
    expect(defaultSettings).toBeTruthy();
    expect(defaultSettings.userId).toBe(TEST_USER_ID);
    expect(defaultSettings.jobcanEmail).toBe('');
    expect(defaultSettings.timezone).toBe('Asia/Seoul');
    
    console.log('기본 설정이 생성되었습니다:', defaultSettings);
  });
  
  test('설정 조회 테스트', async () => {
    // 설정 조회
    const settings = await SettingsService.getSettingsByUserId(TEST_USER_ID);
    expect(settings).toBeTruthy();
    expect(settings?.userId).toBe(TEST_USER_ID);
    
    console.log('설정이 조회되었습니다:', settings);
  });
  
  test('설정 저장 테스트', async () => {
    // 설정 저장
    const newSettings = {
      jobcanEmail: 'updated@example.com',
      jobcanPassword: 'updatedpassword',
      weekdaysOnly: false,
      checkInTime: '10:00',
      checkOutTime: '19:00',
      schedulerEnabled: true,
      checkInDelay: 0,
      checkOutDelay: 10,
      timezone: 'Asia/Tokyo',
      testMode: true,
      messageLanguage: 'en',
      telegramBotToken: 'updated-token',
      telegramChatId: 'updated-chat-id',
      annualLeaveCalendarUrl: 'https://updated-example.com/calendar',
      annualLeaveKeyword: '휴가'
    };
    
    const savedSettings = await SettingsService.saveSettings(TEST_USER_ID, newSettings);
    expect(savedSettings).toBeTruthy();
    expect(savedSettings.jobcanEmail).toBe('updated@example.com');
    expect(savedSettings.timezone).toBe('Asia/Tokyo');
    expect(savedSettings.annualLeaveKeyword).toBe('휴가');
    
    console.log('설정이 업데이트되었습니다:', savedSettings);
    
    // 변경된 설정 확인
    const updatedSettings = await SettingsService.getSettingsByUserId(TEST_USER_ID);
    expect(updatedSettings).toBeTruthy();
    expect(updatedSettings?.jobcanEmail).toBe('updated@example.com');
    
    console.log('업데이트된 설정 확인:', updatedSettings);
  });
  
  test('설정 존재 여부 확인 테스트', async () => {
    // 설정 존재 여부 확인
    const hasSettings = await SettingsService.hasSettings(TEST_USER_ID);
    expect(hasSettings).toBeTruthy();
    
    // 존재하지 않는 사용자 확인
    const nonExistentUserId = 'non-existent-user-id';
    const hasNoSettings = await SettingsService.hasSettings(nonExistentUserId);
    expect(hasNoSettings).toBeFalsy();
  });
  
  test.afterAll(async () => {
    // 테스트 후 정리
    await prisma.settings.deleteMany({
      where: { userId: TEST_USER_ID }
    });
    
    await prisma.user.deleteMany({
      where: { id: TEST_USER_ID }
    });
    
    await prisma.$disconnect();
  });
});
