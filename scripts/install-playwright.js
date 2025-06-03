const { exec } = require('child_process');

console.log('Playwright를 설치하고 있습니다...');

// Playwright 설치 명령어 실행
exec('npx playwright install --with-deps', (error, stdout, stderr) => {
  if (error) {
    console.error(`설치 오류: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`설치 stderr: ${stderr}`);
  }
  
  console.log(stdout);
  console.log('Playwright가 성공적으로 설치되었습니다!');
});
