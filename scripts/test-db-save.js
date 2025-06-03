const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// SQLite 데이터베이스 파일 경로
const DB_PATH = path.join(PROJECT_ROOT, 'prisma', 'dev.db');

// 테스트 실행 함수
async function runTests() {
  try {
    console.log('데이터베이스 저장 기능을 테스트합니다...');
    
    // 데이터베이스 파일 존재 여부 확인
    const dbExists = fs.existsSync(DB_PATH);
    if (!dbExists) {
      console.log('데이터베이스 파일이 존재하지 않습니다. 데이터베이스를 초기화합니다...');
      await execAsync('npm run reset-db', { cwd: PROJECT_ROOT });
    }
    
    // 스키마 테스트 실행
    console.log('\n스키마 테스트를 실행합니다...');
    try {
      await execAsync('npm run test:schema', { cwd: PROJECT_ROOT });
      console.log('✅ 스키마 테스트 성공!');
    } catch (error) {
      console.error('❌ 스키마 테스트 실패:', error.stdout || error.message);
      console.log('데이터베이스를 리셋하고 다시 시도합니다...');
      
      // 데이터베이스 리셋 실행
      await execAsync('npm run reset-db', { cwd: PROJECT_ROOT });
      
      // 스키마 테스트 다시 실행
      try {
        await execAsync('npm run test:schema', { cwd: PROJECT_ROOT });
        console.log('✅ 리셋 후 스키마 테스트 성공!');
      } catch (retryError) {
        console.error('❌ 리셋 후에도 스키마 테스트 실패:', retryError.stdout || retryError.message);
        process.exit(1);
      }
    }
    
    // API 테스트 실행
    console.log('\nAPI 테스트를 실행합니다...');
    try {
      await execAsync('npm run test:api', { cwd: PROJECT_ROOT });
      console.log('✅ API 테스트 성공!');
    } catch (error) {
      console.error('❌ API 테스트 실패:', error.stdout || error.message);
    }
    
    // DB 저장 테스트 실행
    console.log('\nDB 저장 테스트를 실행합니다...');
    try {
      await execAsync('npm run test:db', { cwd: PROJECT_ROOT });
      console.log('✅ DB 저장 테스트 성공!');
    } catch (error) {
      console.error('❌ DB 저장 테스트 실패:', error.stdout || error.message);
    }
    
    console.log('\n모든 테스트가 완료되었습니다.');
  } catch (error) {
    console.error('테스트 실행 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

// 스크립트 실행
runTests();
