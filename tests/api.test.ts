import { test, expect } from '@playwright/test';

test.describe('설정 API 테스트', () => {
  test('설정 API 엔드포인트 직접 호출 테스트', async ({ request }) => {
    // POST 요청 테스트 (인증 없이 직접 호출하므로 401 응답 예상)
    const postResponse = await request.post('/api/settings', {
      data: {
        jobcanEmail: 'test@example.com',
        jobcanPassword: 'password123',
        weekdaysOnly: true,
        checkInTime: '09:00',
        checkOutTime: '18:00'
      }
    });
    
    // 401 응답 확인 (인증 없이 호출하므로)
    expect(postResponse.status()).toBe(401);
    
    // GET 요청 테스트 (인증 없이 직접 호출하므로 401 응답 예상)
    const getResponse = await request.get('/api/settings');
    expect(getResponse.status()).toBe(401);
    
    // 응답 내용 확인
    const responseBody = await getResponse.json();
    expect(responseBody).toHaveProperty('success', false);
    expect(responseBody).toHaveProperty('message');
    
    console.log('API 응답:', responseBody);
  });
});
