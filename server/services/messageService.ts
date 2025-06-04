export class MessageService {
  private lang: string;
  private messages: Record<string, Record<string, string>>;

  constructor(lang: string = 'ko') {
    this.lang = lang;
    this.messages = {
      en: {
        configLoadError: `[ERROR] Failed to load configuration files: \${params.errorMsg}`,
        loginCredentialsNotFound: '[WARNING] Jobcan login credentials not found. Manual login required.',
        automaticLoginError: `[ERROR] Jobcan automatic login failed: \${params.errorMsg}`,
        navigateToAttendanceError: `[ERROR] Failed to navigate to Jobcan attendance page (timeout or error): \${params.errorMsg}`,
        browserLaunchError: `[ERROR] Critical error during browser launch or login page processing: \${params.errorMsg}`,
        getWorkingStatusError: `[ERROR] Failed to get working status: \${params.errorMsg}`,
        clickButtonError: `[ERROR] Error clicking attendance button or waiting for API response: \${params.errorMsg}`,
        checkInProcessError: '[ERROR] Check-in process failed: Could not determine current working status.',
        checkInClickError: '[ERROR] Check-in process failed: Failed to click the attendance button.',
        checkInSuccess: `[SUCCESS] Jobcan check-in complete. Current status: \${params.status}`,
        checkInWarning: `[WARNING] Check-in may have failed or status change not confirmed. Current status: "\${params.newStatus}", expected: "\${params.expectedStatus}".`,
        checkInAlreadyDone: `[INFO] Already checked in. Status is "\${params.status}".`,
        checkInInvalidStatus: `[WARNING] Cannot check in. Current status is "\${params.status}", expected "\${params.expectedStatus}".`,
        checkOutProcessError: '[ERROR] Check-out process failed: Could not determine current working status.',
        checkOutClickError: '[ERROR] Check-out process failed: Failed to click the attendance button.',
        checkOutSuccess: `[SUCCESS] Jobcan check-out complete. Current status: \${params.status}`,
        checkOutWarning: `[WARNING] Check-out may have failed or status change not confirmed. Current status: "\${params.newStatus}", expected: "\${params.expectedStatus}" or "\${params.altExpectedStatus}".`,
        checkOutAlreadyDone: `[INFO] Already checked out or not checked in. Status is "\${params.status}".`,
        checkOutInvalidStatus: `[WARNING] Cannot check out. Current status is "\${params.status}", expected "\${params.expectedStatus}".`,
        mainScriptError: `[CRITICAL] Critical error in main Jobcan automation script: \${params.errorMsg}`,
        schedulerExecError: `[ERROR] Error executing scheduled \${params.action} job: \${params.errorMsg}`,
        schedulerExecStdErr: `[WARNING] Stderr during scheduled \${params.action} job: \${params.stderrMsg}`,
        schedulerInvalidCron: `[ERROR] Invalid cron expression for \${params.type}: \${params.cronExpr}`,
        schedulerStartError: `[CRITICAL] Error starting scheduler: \${params.errorMsg}`,
        schedulerSkipAnnualLeave: `Today is an annual leave day (\${params.holidayName}). Skipping job.`,
        schedulerSkipPublicHoliday: `Today is a public holiday (\${params.holidayName}). Skipping job.`,
        schedulerSkipReason: `Skipping job: \${params.reason}`,
      },
      ko: {
        configLoadError: `[오류] 설정 파일 로드 실패: \${params.errorMsg}`,
        loginCredentialsNotFound: '[경고] Jobcan 로그인 정보를 찾을 수 없습니다. 수동 로그인이 필요합니다.',
        automaticLoginError: `[오류] Jobcan 자동 로그인 실패: \${params.errorMsg}`,
        navigateToAttendanceError: `[오류] Jobcan 출퇴근 페이지 접속 실패 (타임아웃 또는 오류): \${params.errorMsg}`,
        browserLaunchError: `[오류] 브라우저 시작 또는 로그인 페이지 처리 중 심각한 오류: \${params.errorMsg}`,
        getWorkingStatusError: `[오류] 근무 상태 확인 실패: \${params.errorMsg}`,
        clickButtonError: `[오류] 출퇴근 버튼 클릭 또는 API 응답 대기 중 오류: \${params.errorMsg}`,
        checkInProcessError: '[오류] 출근 처리 실패: 현재 근무 상태를 확인할 수 없습니다.',
        checkInClickError: '[오류] 출근 처리 실패: 출근 버튼 클릭에 실패했습니다.',
        checkInSuccess: `[성공] Jobcan 출근 처리가 완료되었습니다. 현재 상태: \${params.status}`,
        checkInWarning: `[주의] 출근 처리가 실패했거나 상태 변경이 확인되지 않았습니다. 현재 상태: "\${params.newStatus}", 예상 상태: "\${params.expectedStatus}".`,
        checkInAlreadyDone: `[정보] 이미 출근한 상태입니다 (\${params.status}).`,
        checkInInvalidStatus: `[경고] 출근할 수 없습니다. 현재 상태: "\${params.status}", 예상 상태: "\${params.expectedStatus}".`,
        checkOutProcessError: '[오류] 퇴근 처리 실패: 현재 근무 상태를 확인할 수 없습니다.',
        checkOutClickError: '[오류] 퇴근 버튼 클릭에 실패했습니다.',
        checkOutSuccess: `[성공] Jobcan 퇴근 처리가 완료되었습니다. 현재 상태: \${params.status}`,
        checkOutWarning: `[주의] 퇴근 처리가 실패했거나 상태 변경이 확인되지 않았습니다. 현재 상태: "\${params.newStatus}", 예상 상태: "\${params.expectedStatus}" 또는 "\${params.altExpectedStatus}".`,
        checkOutAlreadyDone: `[정보] 이미 퇴근했거나 출근하지 않은 상태입니다. 현재 상태: "\${params.status}".`,
        checkOutInvalidStatus: `[경고] 퇴근할 수 없습니다. 현재 상태: "\${params.status}", 예상 상태: "\${params.expectedStatus}".`,
        mainScriptError: `[심각] Jobcan 자동화 스크립트 메인 실행 중 심각한 오류 발생: \${params.errorMsg}`,
        schedulerExecError: `[오류] 스케줄된 \${params.action} 작업 실행 중 오류 발생: \${params.errorMsg}`,
        schedulerExecStdErr: `[경고] 스케줄된 \${params.action} 작업 실행 중 표준 오류 발생: \${params.stderrMsg}`,
        schedulerInvalidCron: `[오류] 잘못된 \${params.type} 크론 표현식: \${params.cronExpr}`,
        schedulerStartError: `[심각] 스케줄러 시작 중 오류 발생: \${params.errorMsg}`,
        schedulerSkipAnnualLeave: `오늘은 연차입니다 (\${params.holidayName}). 작업을 건너뜁니다.`,
        schedulerSkipPublicHoliday: `오늘은 공휴일입니다 (\${params.holidayName}). 작업을 건너뜁니다.`,
        schedulerSkipReason: `작업 건너뛰기: \${params.reason}`,
      },
      ja: {
        configLoadError: `[エラー] 設定ファイルの読み込みに失敗しました: \${params.errorMsg}`,
        loginCredentialsNotFound: '[警告] Jobcanのログイン情報が見つかりません。手動ログインが必要です。',
        automaticLoginError: `[エラー] Jobcan自動ログイン失敗: \${params.errorMsg}`,
        navigateToAttendanceError: `[エラー] Jobcan勤怠ページへの移動に失敗しました (タイムアウトまたはエラー): \${params.errorMsg}`,
        browserLaunchError: `[エラー] ブラウザの起動またはログインページ処理中に重大なエラーが発生しました: \${params.errorMsg}`,
        getWorkingStatusError: `[エラー] 勤務状態の取得に失敗しました: \${params.errorMsg}`,
        clickButtonError: `[エラー] 勤怠ボタンのクリックまたはAPI応答待機中にエラーが発生しました: \${params.errorMsg}`,
        checkInProcessError: '[エラー] 出勤処理に失敗しました: 現在の勤務状態を確認できません。',
        checkInClickError: '[エラー] 出勤処理に失敗しました: 出勤ボタンのクリックに失敗しました。',
        checkInSuccess: `[成功] Jobcan出勤処理が完了しました。現在の状態: \${params.status}`,
        checkInWarning: `[注意] 出勤処理が失敗したか、状態変更が確認できませんでした。現在の状態: "\${params.newStatus}", 期待される状態: "\${params.expectedStatus}".`,
        checkInAlreadyDone: `[情報] すでに出勤済みです (\${params.status})。`,
        checkInInvalidStatus: `[警告] 出勤できません。現在の状態: "\${params.status}", 期待される状態: "\${params.expectedStatus}".`,
        checkOutProcessError: '[エラー] 退勤処理に失敗しました: 現在の勤務状態を確認できません。',
        checkOutClickError: '[エラー] 退勤ボタンのクリックに失敗しました。',
        checkOutSuccess: `[成功] Jobcan退勤処理が完了しました。現在の状態: \${params.status}`,
        checkOutWarning: `[注意] 退勤処理が失敗したか、状態変更が確認できませんでした。現在の状態: "\${params.newStatus}", 期待される状態: "\${params.expectedStatus}" または "\${params.altExpectedStatus}".`,
        checkOutAlreadyDone: `[情報] すでに退勤済みまたは出勤していません。現在の状態: "\${params.status}".`,
        checkOutInvalidStatus: `[警告] 退勤できません。現在の状態: "\${params.status}", 期待される状態: "\${params.expectedStatus}".`,
        mainScriptError: `[重大] Jobcan自動化スクリプトのメイン実行中に重大なエラーが発生しました: \${params.errorMsg}`,
        schedulerExecError: `[エラー] スケジュールされた\${params.action}ジョブの実行中にエラーが発生しました: \${params.errorMsg}`,
        schedulerExecStdErr: `[警告] スケジュールされた\${params.action}ジョブの実行中に標準エラーが発生しました: \${params.stderrMsg}`,
        schedulerInvalidCron: `[エラー] 無効な\${params.type}のcron式: \${params.cronExpr}`,
        schedulerStartError: `[重大] スケジューラの起動中にエラーが発生しました: \${params.errorMsg}`,
        schedulerSkipAnnualLeave: `本日は年次休暇日です（\${params.holidayName}）。ジョブをスキップします。`,
        schedulerSkipPublicHoliday: `本日は祝日です（\${params.holidayName}）。ジョブをスキップします。`,
        schedulerSkipReason: `ジョブのスキップ理由: \${params.reason}`,
      }
    };
  }

  public getMessage(key: string, params: Record<string, any> = {}): string {
    // Get message template from the specified language or fallback to English
    const messageTemplate = this.messages[this.lang]?.[key] || this.messages.en[key] || `Missing message for key: ${key}`;
    
    // Replace placeholders with actual values
    return messageTemplate.replace(/\${params\.(\w+)}/g, (match, paramName) => {
      return params[paramName] !== undefined ? params[paramName] : match;
    });
  }
}
