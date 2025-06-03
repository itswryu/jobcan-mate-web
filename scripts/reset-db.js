const { exec } = require('child_process');

console.log('Prisma 마이그레이션을 강제로 재설정합니다...');

// 마이그레이션 리셋 명령어 실행
exec('npx prisma migrate reset --force', (error, stdout, stderr) => {
  if (error) {
    console.error(`마이그레이션 리셋 오류: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`마이그레이션 리셋 stderr: ${stderr}`);
  }
  
  console.log(stdout);
  console.log('마이그레이션이 성공적으로 리셋되었습니다!');
  
  // 새 마이그레이션 생성
  exec('npx prisma migrate dev --name init', (err, out, stdErr) => {
    if (err) {
      console.error(`마이그레이션 생성 오류: ${err.message}`);
      return;
    }
    
    if (stdErr) {
      console.error(`마이그레이션 생성 stderr: ${stdErr}`);
    }
    
    console.log(out);
    console.log('새 마이그레이션이 성공적으로 생성되었습니다!');
    
    // Prisma 클라이언트 생성
    exec('npx prisma generate', (genErr, genOut, genStdErr) => {
      if (genErr) {
        console.error(`클라이언트 생성 오류: ${genErr.message}`);
        return;
      }
      
      if (genStdErr) {
        console.error(`클라이언트 생성 stderr: ${genStdErr}`);
      }
      
      console.log(genOut);
      console.log('Prisma 클라이언트가 성공적으로 생성되었습니다!');
      console.log('이제 npm run dev로 애플리케이션을 다시 시작하세요.');
    });
  });
});
