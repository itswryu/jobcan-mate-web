import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

test.describe('데이터베이스 스키마 테스트', () => {
  test('데이터베이스 마이그레이션 상태 확인', async () => {
    try {
      // 마이그레이션 상태 확인
      const { stdout } = await execAsync('npx prisma migrate status');
      console.log('마이그레이션 상태:', stdout);
      
      // Applied Migrations 포함 여부 확인
      expect(stdout).toContain('Migrations');
    } catch (error) {
      console.error('마이그레이션 상태 확인 중 오류:', error);
      throw error;
    }
  });
  
  test('데이터베이스 모델 구조 확인', async () => {
    try {
      // 사용자 모델 필드 확인
      const userModelInfo = await prisma.$queryRaw`
        PRAGMA table_info(User);
      `;
      console.log('User 모델 정보:', userModelInfo);
      
      // 설정 모델 필드 확인
      const settingsModelInfo = await prisma.$queryRaw`
        PRAGMA table_info(Settings);
      `;
      console.log('Settings 모델 정보:', settingsModelInfo);
      
      // Settings 테이블에 필요한 필드가 있는지 확인
      const settingsFields = settingsModelInfo as { name: string }[];
      const requiredFields = [
        'id', 'userId', 'jobcanEmail', 'jobcanPassword', 
        'weekdaysOnly', 'checkInTime', 'checkOutTime'
      ];
      
      for (const field of requiredFields) {
        const hasField = settingsFields.some(f => f.name === field);
        expect(hasField).toBeTruthy();
      }
      
    } catch (error) {
      console.error('데이터베이스 모델 구조 확인 중 오류:', error);
      throw error;
    }
  });
  
  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
