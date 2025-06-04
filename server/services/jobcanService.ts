import { chromium, Browser, Page } from 'playwright';
import { TelegramNotificationService } from './notificationService';
import { MessageService } from './messageService';
import { logInfo, logError, logWarning, logSuccess } from '../utils/logger';
import { Settings } from '@prisma/client';

export interface JobcanConfig {
  jobcanEmail: string;
  jobcanPassword: string;
  loginUrl: string;
  attendanceUrl: string;
  loginCredentials: {
    emailXPath: string;
    passwordXPath: string;
    loginButtonXPath: string;
  };
  attendanceButtonXPath: string;
  workingStatusXPath: string;
  testMode: boolean;
  headless: boolean;
  messageLanguage: string;
}

export class JobcanService {
  private config: JobcanConfig;
  private notificationService: TelegramNotificationService;
  private messageService: MessageService;

  constructor(settings: Settings) {
    this.config = {
      jobcanEmail: settings.jobcanEmail,
      jobcanPassword: settings.jobcanPassword,
      loginUrl: 'https://id.jobcan.jp/users/sign_in?app_key=atd',
      attendanceUrl: 'https://ssl.jobcan.jp/employee',
      loginCredentials: {
        emailXPath: "//*[@id='user_email']",
        passwordXPath: "//*[@id='user_password']",
        loginButtonXPath: "//*[@id='login_button']"
      },
      attendanceButtonXPath: "//*[@id='adit-button-push']",
      workingStatusXPath: "//*[@id='working_status']",
      testMode: settings.testMode,
      headless: true,
      messageLanguage: settings.messageLanguage,
    };

    this.messageService = new MessageService(settings.messageLanguage);
    this.notificationService = new TelegramNotificationService(
      settings.telegramBotToken, 
      settings.telegramChatId
    );
  }

  public async launchBrowserAndLoginPage(): Promise<{ browser: Browser; page: Page }> {
    let browser: Browser;
    try {
      logInfo('Launching browser...');
      browser = await chromium.launch({ headless: this.config.headless });
      const context = await browser.newContext();
      const page = await context.newPage();

      logInfo(`Navigating to login page: ${this.config.loginUrl}`);
      await page.goto(this.config.loginUrl);

      if (this.config.jobcanEmail && this.config.jobcanPassword) {
        logInfo('Attempting to log in automatically using provided credentials...');
        try {
          await page.fill(this.config.loginCredentials.emailXPath, this.config.jobcanEmail);
          await page.fill(this.config.loginCredentials.passwordXPath, this.config.jobcanPassword);
          await page.click(this.config.loginCredentials.loginButtonXPath);
          logInfo('Login form submitted.');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logError('Error during automatic login attempt:', errorMessage);
          await this.notificationService.sendNotification(
            this.messageService.getMessage('automaticLoginError', { errorMsg: errorMessage }),
            true
          );
          logInfo('Please log in manually.');
        }
      } else {
        const message = 'Jobcan login credentials not found. Manual login required.';
        logWarning(message);
        await this.notificationService.sendNotification(
          this.messageService.getMessage('loginCredentialsNotFound'),
          true
        );
      }

      logInfo(`Waiting for navigation to attendance page: ${this.config.attendanceUrl} or for 2 minutes...`);

      try {
        await page.waitForURL(url => url.toString().startsWith(this.config.attendanceUrl), { timeout: 120000 });
        logInfo('Successfully navigated to the attendance page.');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logError('Timeout or error while waiting for navigation to attendance page:', errorMessage);
        await this.notificationService.sendNotification(
          this.messageService.getMessage('navigateToAttendanceError', { errorMsg: errorMessage }),
          true
        );
        logInfo('Browser will remain open for manual intervention or inspection.');
      }
      return { browser, page };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('Error in launchBrowserAndLoginPage:', errorMessage);
      await this.notificationService.sendNotification(
        this.messageService.getMessage('browserLaunchError', { errorMsg: errorMessage }),
        true
      );
      if (browser!) {
        await browser!.close();
      }
      throw error;
    }
  }

  public async getWorkingStatus(page: Page): Promise<string | null> {
    try {
      const statusElement = await page.waitForSelector(this.config.workingStatusXPath, { timeout: 10000 });
      const statusText = await statusElement.textContent();
      const status = statusText ? statusText.trim() : '';
      logInfo(`Current working status: ${status}`);
      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('Error getting working status:', errorMessage);
      await this.notificationService.sendNotification(
        this.messageService.getMessage('getWorkingStatusError', { errorMsg: errorMessage }),
        true
      );
      return null;
    }
  }

  public async clickAttendanceButton(page: Page): Promise<boolean> {
    if (this.config.testMode) {
      logInfo('[Test Mode] Attendance button click skipped.');
      return true;
    }
    try {
      logInfo('Attempting to click attendance button...');
      const responsePromise = page.waitForResponse(
        response =>
          response.url().includes('jobcan.jp/employee/') &&
          (response.request().method() === 'POST' || response.request().method() === 'PUT') &&
          response.status() === 200,
        { timeout: 10000 }
      );

      await page.click(this.config.attendanceButtonXPath);
      logInfo('Attendance button clicked. Waiting for API response...');

      try {
        const response = await responsePromise;
        logInfo(`API response received: ${response.status()} ${response.url()}`);
      } catch (e) {
        logWarning('API response timed out or did not match criteria after 10 seconds.');
      }

      await page.waitForTimeout(1500);
      logInfo('Waited for potential UI update after API response.');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('Error clicking attendance button or waiting for API response:', errorMessage);
      await this.notificationService.sendNotification(
        this.messageService.getMessage('clickButtonError', { errorMsg: errorMessage }),
        true
      );
      return false;
    }
  }

  public async checkIn(page: Page): Promise<boolean> {
    logInfo('Attempting Check-In...');
    const currentStatus = await this.getWorkingStatus(page);

    if (currentStatus === null) {
      await this.notificationService.sendNotification(
        this.messageService.getMessage('checkInProcessError'),
        true
      );
      return false;
    }

    // Standard Jobcan statuses (Korean)
    const STATUS_NOT_CHECKED_IN_KO = '미출근';
    const STATUS_WORKING_KO = '근무중';

    if (currentStatus === STATUS_NOT_CHECKED_IN_KO) {
      logInfo(`Status is "${STATUS_NOT_CHECKED_IN_KO}". Proceeding with check-in.`);
      const clicked = await this.clickAttendanceButton(page);
      if (clicked) {
        const newStatus = await this.getWorkingStatus(page);
        if (newStatus === STATUS_WORKING_KO) {
          logSuccess(`Check-In successful. Status changed to "${STATUS_WORKING_KO}".`);
          await this.notificationService.sendNotification(
            this.messageService.getMessage('checkInSuccess', { status: newStatus }),
            false
          );
          return true;
        } else {
          const params = { newStatus: newStatus, expectedStatus: STATUS_WORKING_KO };
          logWarning(this.messageService.getMessage('checkInWarning', params));
          await this.notificationService.sendNotification(
            this.messageService.getMessage('checkInWarning', params),
            true
          );
          return false;
        }
      } else {
        await this.notificationService.sendNotification(
          this.messageService.getMessage('checkInClickError'),
          true
        );
        return false;
      }
    } else if (currentStatus === STATUS_WORKING_KO) {
      const params = { status: currentStatus };
      logInfo(this.messageService.getMessage('checkInAlreadyDone', params));
      // Optional: notify if already checked in
      // await this.notificationService.sendNotification(
      //   this.messageService.getMessage('checkInAlreadyDone', params),
      //   false
      // );
      return true;
    } else {
      const params = { status: currentStatus, expectedStatus: STATUS_NOT_CHECKED_IN_KO };
      logWarning(this.messageService.getMessage('checkInInvalidStatus', params));
      await this.notificationService.sendNotification(
        this.messageService.getMessage('checkInInvalidStatus', params),
        true
      );
      return false;
    }
  }

  public async checkOut(page: Page): Promise<boolean> {
    logInfo('Attempting Check-Out...');
    const currentStatus = await this.getWorkingStatus(page);

    if (currentStatus === null) {
      await this.notificationService.sendNotification(
        this.messageService.getMessage('checkOutProcessError'),
        true
      );
      return false;
    }

    // Standard Jobcan statuses (Korean)
    const STATUS_WORKING_KO = '근무중';
    const STATUS_RESTING_KO = '휴식중'; // Expected after checkout as per project.md
    const STATUS_NOT_CHECKED_IN_KO = '미출근'; // Also a possible state after checkout

    if (currentStatus === STATUS_WORKING_KO) {
      logInfo(`Status is "${STATUS_WORKING_KO}". Proceeding with check-out.`);
      const clicked = await this.clickAttendanceButton(page);
      if (clicked) {
        const newStatus = await this.getWorkingStatus(page);
        if (newStatus === STATUS_RESTING_KO || newStatus === STATUS_NOT_CHECKED_IN_KO) {
          logSuccess(`Check-Out successful. Status changed to "${newStatus}".`);
          await this.notificationService.sendNotification(
            this.messageService.getMessage('checkOutSuccess', { status: newStatus }),
            false
          );
          return true;
        } else {
          const params = { 
            newStatus: newStatus, 
            expectedStatus: STATUS_RESTING_KO, 
            altExpectedStatus: STATUS_NOT_CHECKED_IN_KO 
          };
          logWarning(this.messageService.getMessage('checkOutWarning', params));
          await this.notificationService.sendNotification(
            this.messageService.getMessage('checkOutWarning', params),
            true
          );
          return false;
        }
      } else {
        await this.notificationService.sendNotification(
          this.messageService.getMessage('checkOutClickError'),
          true
        );
        return false;
      }
    } else if (currentStatus === STATUS_RESTING_KO || currentStatus === STATUS_NOT_CHECKED_IN_KO) {
      const params = { status: currentStatus };
      logInfo(this.messageService.getMessage('checkOutAlreadyDone', params));
      await this.notificationService.sendNotification(
        this.messageService.getMessage('checkOutAlreadyDone', params),
        false
      );
      return true;
    } else {
      const params = { status: currentStatus, expectedStatus: STATUS_WORKING_KO };
      logWarning(this.messageService.getMessage('checkOutInvalidStatus', params));
      await this.notificationService.sendNotification(
        this.messageService.getMessage('checkOutInvalidStatus', params),
        true
      );
      return false;
    }
  }

  public async performAction(action: 'checkIn' | 'checkOut'): Promise<{ success: boolean; message: string }> {
    let browser: Browser | null = null;
    
    try {
      const { browser: launchedBrowser, page } = await this.launchBrowserAndLoginPage();
      browser = launchedBrowser;

      logInfo('Login process finished (or timed out).');
      logInfo('Current page URL:', page.url());

      let success = false;
      if (action === 'checkIn') {
        logInfo('Action: Check-In');
        success = await this.checkIn(page);
      } else if (action === 'checkOut') {
        logInfo('Action: Check-Out');
        success = await this.checkOut(page);
      } else {
        logError(`Invalid action: ${action}. Please use 'checkIn' or 'checkOut'.`);
        return { 
          success: false, 
          message: `유효하지 않은 작업입니다: ${action}. 'checkIn' 또는 'checkOut'을 사용하세요.` 
        };
      }

      if (success) {
        const message = `Action "${action}" completed successfully.`;
        logSuccess(message);
        return { 
          success: true, 
          message: action === 'checkIn' ? '출근 처리가 완료되었습니다.' : '퇴근 처리가 완료되었습니다.' 
        };
      } else {
        const message = `Action "${action}" may have failed or was not applicable.`;
        logWarning(message);
        return { 
          success: false, 
          message: action === 'checkIn' 
            ? '출근 처리에 실패했거나 적용할 수 없습니다.' 
            : '퇴근 처리에 실패했거나 적용할 수 없습니다.' 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('An error occurred in the JobcanService:', errorMessage);
      await this.notificationService.sendNotification(
        this.messageService.getMessage('mainScriptError', { errorMsg: errorMessage }),
        true
      );
      return { success: false, message: `처리 중 오류가 발생했습니다: ${errorMessage}` };
    } finally {
      if (browser) {
        logInfo('Closing browser...');
        await browser.close();
      }
      logInfo('JobcanService operation finished.');
    }
  }
}
