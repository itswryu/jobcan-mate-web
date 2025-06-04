/**
 * 수동 출근 스크립트
 * 
 * 이 스크립트는 설정 파일에 있는 첫 번째 사용자의 출근 작업을 실행합니다.
 * 주로 디버깅 및 테스트 목적으로 사용됩니다.
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Prisma 클라이언트 초기화
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('수동 출근 스크립트 시작...');

    // 1. 데이터베이스 체크
    const dbPath = path.join(process.cwd(), 'prisma/dev.db');
    if (!fs.existsSync(dbPath)) {
      console.error('데이터베이스 파일이 없습니다. 데이터베이스를 초기화해주세요.');
      console.log('npm run setup-db 명령을 실행하여 데이터베이스를 초기화할 수 있습니다.');
      process.exit(1);
    }

    // 2. 사용자 찾기
    const user = await prisma.user.findFirst({
      include: {
        settings: true
      }
    });

    if (!user) {
      console.error('사용자 정보가 없습니다. 먼저 로그인하고 설정을 완료해주세요.');
      process.exit(1);
    }

    if (!user.settings) {
      console.error('사용자 설정이 없습니다. 설정 페이지에서 Jobcan 계정 정보를 설정해주세요.');
      process.exit(1);
    }

    console.log(`사용자 ${user.email || user.id}의 출근 작업을 시작합니다...`);

    // 3. 출근 API 실행
    const apiUrl = 'http://localhost:3000/api/jobcan';
    console.log(`curl -X POST ${apiUrl} -H "Content-Type: application/json" -d '{"action":"checkIn"}'`);
    
    try {
      const result = execSync(`curl -X POST ${apiUrl} -H "Content-Type: application/json" -d '{"action":"checkIn"}'`, {
        encoding: 'utf-8'
      });
      console.log('결과:', result);
    } catch (error) {
      console.error('API 호출 중 오류 발생:', error.message);
      console.log('서버가 실행 중인지 확인해주세요.');
      console.log('개발 서버를 실행하려면 "npm run dev" 명령을 사용하세요.');
    }

  } catch (error) {
    console.error('스크립트 실행 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
