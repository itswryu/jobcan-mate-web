const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// SQLite 데이터베이스 파일 경로
const DB_PATH = path.join(PROJECT_ROOT, 'prisma', 'dev.db');
const MIGRATIONS_PATH = path.join(PROJECT_ROOT, 'prisma', 'migrations');

async function forceResetDatabase() {
  try {
    console.log('데이터베이스를 강제로 재설정합니다...');
    
    // 1. 기존 데이터베이스 파일 삭제
    if (fs.existsSync(DB_PATH)) {
      console.log('기존 데이터베이스 파일을 삭제합니다:', DB_PATH);
      fs.unlinkSync(DB_PATH);
    } else {
      console.log('데이터베이스 파일이 존재하지 않습니다.');
    }
    
    // 2. migrations 디렉토리 삭제 (완전히 초기화)
    if (fs.existsSync(MIGRATIONS_PATH)) {
      console.log('기존 마이그레이션 디렉토리를 삭제합니다:', MIGRATIONS_PATH);
      fs.rmSync(MIGRATIONS_PATH, { recursive: true, force: true });
    } else {
      console.log('마이그레이션 디렉토리가 존재하지 않습니다.');
    }
    
    // 3. Prisma 스키마 유효성 검사
    console.log('Prisma 스키마 유효성을 검사합니다...');
    try {
      await execAsync('npx prisma validate', { cwd: PROJECT_ROOT });
      console.log('Prisma 스키마가 유효합니다.');
    } catch (validateError) {
      console.error('Prisma 스키마 유효성 검사 실패:', validateError.stdout || validateError.message);
      throw new Error('Prisma 스키마가 유효하지 않습니다.');
    }
    
    // 4. 새 마이그레이션 생성
    console.log('새 마이그레이션을 생성합니다...');
    try {
      const { stdout: migrateOutput } = await execAsync('npx prisma migrate dev --name initial_setup --create-only', { cwd: PROJECT_ROOT });
      console.log('마이그레이션 생성 결과:', migrateOutput);
    } catch (migrateError) {
      console.error('마이그레이션 생성 실패:', migrateError.stdout || migrateError.message);
      // 마이그레이션 생성 실패는 무시하고 진행 (이미 존재할 수 있음)
      console.log('마이그레이션 생성 문제가 발생했지만 계속 진행합니다...');
    }
    
    // 5. 마이그레이션 적용
    console.log('마이그레이션을 적용합니다...');
    try {
      const { stdout: applyOutput } = await execAsync('npx prisma migrate dev', { cwd: PROJECT_ROOT });
      console.log('마이그레이션 적용 결과:', applyOutput);
    } catch (applyError) {
      console.error('마이그레이션 적용 실패:', applyError.stdout || applyError.message);
      throw new Error('마이그레이션을 적용할 수 없습니다.');
    }
    
    // 6. Prisma 클라이언트 생성
    console.log('Prisma 클라이언트를 생성합니다...');
    try {
      const { stdout: generateOutput } = await execAsync('npx prisma generate', { cwd: PROJECT_ROOT });
      console.log('Prisma 클라이언트 생성 결과:', generateOutput);
    } catch (generateError) {
      console.error('Prisma 클라이언트 생성 실패:', generateError.stdout || generateError.message);
      throw new Error('Prisma 클라이언트를 생성할 수 없습니다.');
    }
    
    console.log('데이터베이스가 성공적으로 재설정되었습니다!');
    console.log('\n다음 단계:');
    console.log('1. 서버를 재시작하세요: npm run dev');
    console.log('2. 브라우저에서 로그인을 다시 시도하세요.');
    
    return true;
  } catch (error) {
    console.error('데이터베이스 재설정 중 오류가 발생했습니다:', error);
    return false;
  }
}

// 스크립트 실행
forceResetDatabase()
  .then((success) => {
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
