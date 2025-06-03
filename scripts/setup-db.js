const { exec } = require('child_process');
const path = require('path');

// 스크립트 실행 경로 정의
const scriptPath = path.resolve(process.cwd());

console.log('SQLite 데이터베이스 설정을 시작합니다...');

// Prisma 초기 마이그레이션 실행
const runMigration = async () => {
  return new Promise((resolve, reject) => {
    console.log('Prisma 마이그레이션을 실행합니다...');
    
    const command = 'npx prisma migrate dev --name init';
    
    exec(command, { cwd: scriptPath }, (error, stdout, stderr) => {
      if (error) {
        console.error(`마이그레이션 오류: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`마이그레이션 stderr: ${stderr}`);
      }
      
      console.log(stdout);
      console.log('마이그레이션이 성공적으로 완료되었습니다!');
      resolve(stdout);
    });
  });
};

// Prisma 클라이언트 생성
const generateClient = async () => {
  return new Promise((resolve, reject) => {
    console.log('Prisma 클라이언트를 생성합니다...');
    
    const command = 'npx prisma generate';
    
    exec(command, { cwd: scriptPath }, (error, stdout, stderr) => {
      if (error) {
        console.error(`클라이언트 생성 오류: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`클라이언트 생성 stderr: ${stderr}`);
      }
      
      console.log(stdout);
      console.log('Prisma 클라이언트 생성이 완료되었습니다!');
      resolve(stdout);
    });
  });
};

// 스크립트 실행
const main = async () => {
  try {
    await runMigration();
    await generateClient();
    
    console.log('===========================================');
    console.log('🎉 SQLite 데이터베이스 설정이 완료되었습니다!');
    console.log('다음 단계:');
    console.log('1. npm run dev 명령어로 개발 서버를 실행하세요.');
    console.log('2. 브라우저에서 http://localhost:3000 에 접속하세요.');
    console.log('3. Google 로그인 후 설정 페이지에서 사용자 설정을 확인하세요.');
    console.log('===========================================');

    process.exit(0);
  } catch (error) {
    console.error('데이터베이스 설정 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
};

main();
