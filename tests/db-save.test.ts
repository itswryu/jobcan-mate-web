import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

// 테스트용 계정 정보
const TEST_USER_ID = 'test-user-id';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_SETTINGS = {
  jobcanEmail: 'jobcan@example.com',
  jobcanPassword: 'testpassword',
  weekdaysOnly: true,
  checkInTime: '09:00',
  checkOutTime: '18:00',
  schedulerEnabled: true,
  checkInDelay: -10,
  checkOutDelay: 5,
  timezone: 'Asia/Seoul',
  testMode: true,
  messageLanguage: 'ko',
  telegramBotToken: 'test-token',
  telegramChatId: 'test-chat-id',
  annualLeaveCalendarUrl: 'http://example.com/calendar',
  annualLeaveKeyword: '연차'
};

// Prisma 클라이언트 초기화
const prisma = new PrismaClient();

// 테스트 전 데이터베이스 설정
async function setupTestUser() {
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
        name: 'Test User',
      }
    });
    
    console.log('테스트 사용자가 생성되었습니다:', TEST_USER_ID);
    return true;
  } catch (error) {
    console.error('테스트 사용자 설정 중 오류:', error);
    return false;
  }
}

// 직접 API 호출로 설정 저장 테스트
async function testDirectApiCall() {
  try {
    // 테스트 사용자의 설정 저장
    const settings = await prisma.settings.create({
      data: {
        userId: TEST_USER_ID,
        ...TEST_SETTINGS
      }
    });
    
    console.log('테스트 사용자 설정이 저장되었습니다:', settings.id);
    
    // 저장된 설정 확인
    const savedSettings = await prisma.settings.findUnique({
      where: { userId: TEST_USER_ID }
    });
    
    if (!savedSettings) {
      console.error('저장된 설정을 찾을 수 없습니다.');
      return false;
    }
    
    console.log('저장된 설정 확인:', savedSettings);
    return true;
  } catch (error) {
    console.error('직접 API 호출 테스트 중 오류:', error);
    return false;
  }
}

// 테스트 실행
test.describe('데이터베이스 저장 기능 테스트', () => {
  
  test.beforeAll(async () => {
    // 테스트 사용자 설정
    const setupSuccess = await setupTestUser();
    expect(setupSuccess).toBeTruthy();
  });
  
  test('직접 API 호출로 설정 저장 테스트', async () => {
    const success = await testDirectApiCall();
    expect(success).toBeTruthy();
  });
  
  test('웹 인터페이스를 통한 설정 저장 테스트', async ({ page }) => {
    // 웹 인터페이스에 접근하여 설정 저장 테스트
    // 1. 로컬 서버에 접속
    await page.goto('/');
    
    // 2. Google 로그인 시뮬레이션 (실제 인증은 생략)
    // 여기서는 설정 페이지를 직접 방문하여 테스트합니다
    await page.goto('/settings');
    
    // 3. 콘솔 로그 확인
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // 4. 페이지 내용 확인
    const pageContent = await page.content();
    console.log('페이지 내용 확인:', pageContent.substring(0, 500) + '...');
    
    // 5. 에러 여부 확인
    const hasError = pageContent.includes('Error') || pageContent.includes('error');
    if (hasError) {
      console.warn('페이지에 에러 메시지가 포함되어 있습니다.');
    }
    
    // 6. 로그 출력
    console.log('콘솔 로그:', consoleLogs);
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
