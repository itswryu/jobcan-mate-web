const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);
const prisma = new PrismaClient();
const PROJECT_ROOT = path.resolve(__dirname, '..');

async function fixDatabase() {
  try {
    console.log('데이터베이스 스키마 문제를 확인합니다...');
    
    // 테이블 존재 여부 확인
    let tablesExist = true;
    
    try {
      // 테이블 목록 조회
      const tables = await prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';
      `;
      
      console.log('데이터베이스 테이블 목록:', tables);
      
      // User 및 Settings 테이블 존재 여부 확인
      const tableNames = tables.map(t => t.name);
      const hasUserTable = tableNames.includes('User');
      const hasSettingsTable = tableNames.includes('Settings');
      
      if (!hasUserTable || !hasSettingsTable) {
        tablesExist = false;
        console.log('필요한 테이블이 누락되었습니다. 마이그레이션을 재설정합니다.');
      }
    } catch (error) {
      tablesExist = false;
      console.error('테이블 조회 중 오류가 발생했습니다:', error);
      console.log('마이그레이션을 재설정합니다.');
    }
    
    if (!tablesExist) {
      // 마이그레이션 리셋
      console.log('마이그레이션을 리셋합니다...');
      
      // 기존 데이터베이스 파일 삭제
      const dbPath = path.join(PROJECT_ROOT, 'prisma', 'dev.db');
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('기존 데이터베이스 파일을 삭제했습니다.');
      }
      
      // 마이그레이션 재설정
      try {
        await execAsync('npx prisma migrate dev --name init', { cwd: PROJECT_ROOT });
        console.log('마이그레이션이 성공적으로 재설정되었습니다.');
      } catch (migrateError) {
        console.error('마이그레이션 재설정 중 오류가 발생했습니다:', migrateError);
        throw migrateError;
      }
      
      // Prisma 클라이언트 재생성
      try {
        await execAsync('npx prisma generate', { cwd: PROJECT_ROOT });
        console.log('Prisma 클라이언트가 성공적으로 재생성되었습니다.');
      } catch (generateError) {
        console.error('Prisma 클라이언트 생성 중 오류가 발생했습니다:', generateError);
        throw generateError;
      }
    } else {
      console.log('모든 필요한 테이블이 존재합니다. 추가 조치가 필요하지 않습니다.');
    }
    
    console.log('데이터베이스 스키마 확인이 완료되었습니다.');
    return true;
  } catch (error) {
    console.error('데이터베이스 수정 중 오류가 발생했습니다:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
fixDatabase()
  .then(success => {
    if (success) {
      console.log('데이터베이스 수정이 성공적으로 완료되었습니다.');
      process.exit(0);
    } else {
      console.error('데이터베이스 수정에 실패했습니다.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('스크립트 실행 중 예상치 못한 오류가 발생했습니다:', error);
    process.exit(1);
  });
