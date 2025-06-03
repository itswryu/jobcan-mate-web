import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const prisma = new PrismaClient();

/**
 * 데이터베이스 상태를 확인하고 필요한 경우 초기화합니다.
 */
export async function checkDatabase() {
  console.log('데이터베이스 상태를 확인하는 중...');
  
  try {
    // 테이블 존재 여부 확인
    await prisma.user.count();
    console.log('User 테이블이 존재합니다.');
    
    await prisma.settings.count();
    console.log('Settings 테이블이 존재합니다.');
    
    console.log('데이터베이스가 정상입니다.');
    return true;
  } catch (error) {
    console.error('데이터베이스 테이블이 존재하지 않습니다:', error);
    console.log('데이터베이스를 초기화합니다...');
    
    try {
      // 마이그레이션 실행
      await execAsync('npx prisma migrate dev --name init');
      console.log('마이그레이션이 성공적으로 실행되었습니다.');
      
      // Prisma 클라이언트 재생성
      await execAsync('npx prisma generate');
      console.log('Prisma 클라이언트가 재생성되었습니다.');
      
      return true;
    } catch (migrateError) {
      console.error('마이그레이션 실행 중 오류가 발생했습니다:', migrateError);
      
      // 더 강력한 리셋 시도
      try {
        console.log('강제 리셋을 시도합니다...');
        await execAsync('npm run force-reset-db');
        console.log('강제 리셋이 완료되었습니다.');
        return true;
      } catch (resetError) {
        console.error('강제 리셋 중 오류가 발생했습니다:', resetError);
        return false;
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}
