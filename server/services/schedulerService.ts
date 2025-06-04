import { Settings } from '@prisma/client';
import { logInfo, logError, logWarning, logSuccess } from '../utils/logger';
import { JobcanService } from './jobcanService';
import { CalendarService } from './calendarService';
import { TelegramNotificationService } from './notificationService';
import { MessageService } from './messageService';
import { prisma } from '../../lib/prisma';

export class SchedulerService {
  private settings: Settings;
  private jobcanService: JobcanService;
  private calendarService: CalendarService;
  private notificationService: TelegramNotificationService;
  private messageService: MessageService;

  constructor(settings: Settings) {
    this.settings = settings;
    this.jobcanService = new JobcanService(settings);
    this.calendarService = new CalendarService(settings);
    this.notificationService = new TelegramNotificationService(
      settings.telegramBotToken, 
      settings.telegramChatId
    );
    this.messageService = new MessageService(settings.messageLanguage);
  }

  /**
   * 출근 작업을 실행합니다.
   */
  async executeCheckIn(): Promise<{ success: boolean; message: string }> {
    logInfo(`[${new Date().toISOString()}] 출근 작업 시작...`);
    
    // 1. 오늘이 근무일인지 확인
    const isWorkday = await this.calendarService.isTodayWorkday(this.settings.weekdaysOnly);
    if (!isWorkday) {
      const message = '오늘은 근무일이 아닙니다. 출근 작업을 건너뜁니다.';
      logInfo(message);
      return { success: false, message };
    }
    
    // 2. 출근 실행
    return await this.jobcanService.performAction('checkIn');
  }

  /**
   * 퇴근 작업을 실행합니다.
   */
  async executeCheckOut(): Promise<{ success: boolean; message: string }> {
    logInfo(`[${new Date().toISOString()}] 퇴근 작업 시작...`);
    
    // 1. 오늘이 근무일인지 확인
    const isWorkday = await this.calendarService.isTodayWorkday(this.settings.weekdaysOnly);
    if (!isWorkday) {
      const message = '오늘은 근무일이 아닙니다. 퇴근 작업을 건너뜁니다.';
      logInfo(message);
      return { success: false, message };
    }
    
    // 2. 퇴근 실행
    return await this.jobcanService.performAction('checkOut');
  }

  /**
   * 현재 시간과 출퇴근 설정을 확인하여 적절한 작업을 선택합니다.
   */
  async executeAppropriateAction(): Promise<{ success: boolean; message: string }> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 현재 시간
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // 출근 시간 (지연 포함)
    const [checkInHour, checkInMinute] = this.settings.checkInTime.split(':').map(Number);
    const checkInTimeInMinutes = checkInHour * 60 + checkInMinute + (this.settings.checkInDelay || 0);
    
    // 퇴근 시간 (지연 포함)
    const [checkOutHour, checkOutMinute] = this.settings.checkOutTime.split(':').map(Number);
    const checkOutTimeInMinutes = checkOutHour * 60 + checkOutMinute + (this.settings.checkOutDelay || 0);
    
    // 현재 시간이 출근 시간에 가까운지 퇴근 시간에 가까운지 결정
    const diffFromCheckIn = Math.abs(currentTimeInMinutes - checkInTimeInMinutes);
    const diffFromCheckOut = Math.abs(currentTimeInMinutes - checkOutTimeInMinutes);
    
    if (diffFromCheckIn < diffFromCheckOut) {
      // 출근 시간에 더 가까움
      return await this.executeCheckIn();
    } else {
      // 퇴근 시간에 더 가까움
      return await this.executeCheckOut();
    }
  }

  /**
   * 지정된 사용자의 설정에 따라 출퇴근 작업을 실행합니다.
   * @param userId 사용자 ID
   * @param action 'checkIn' 또는 'checkOut' 또는 'auto'
   */
  static async executeForUser(userId: string, action: 'checkIn' | 'checkOut' | 'auto'): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 사용자 설정 가져오기
      const settings = await prisma.settings.findUnique({
        where: { userId }
      });
      
      if (!settings) {
        return { 
          success: false, 
          message: '사용자 설정을 찾을 수 없습니다. 설정 페이지에서 Jobcan 계정 정보를 설정해주세요.' 
        };
      }
      
      // 2. 스케줄러 활성화 여부 확인
      if (!settings.schedulerEnabled && action === 'auto') {
        return { 
          success: false, 
          message: '자동 스케줄링이 비활성화되어 있습니다. 설정 페이지에서 활성화해주세요.' 
        };
      }
      
      // 3. 서비스 초기화 및 실행
      const schedulerService = new SchedulerService(settings);
      
      if (action === 'checkIn') {
        return await schedulerService.executeCheckIn();
      } else if (action === 'checkOut') {
        return await schedulerService.executeCheckOut();
      } else { // auto
        return await schedulerService.executeAppropriateAction();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError(`사용자 ${userId}의 작업 실행 중 오류 발생:`, errorMessage);
      return { 
        success: false, 
        message: `작업 실행 중 오류가 발생했습니다: ${errorMessage}` 
      };
    }
  }

  /**
   * 해당 시간에 출근 또는 퇴근을 실행해야 하는지 확인하고 실행합니다.
   * @param userId 사용자 ID
   */
  static async checkAndExecuteScheduledAction(userId: string): Promise<{ success: boolean; message: string } | null> {
    try {
      // 1. 사용자 설정 가져오기
      const settings = await prisma.settings.findUnique({
        where: { userId }
      });
      
      if (!settings || !settings.schedulerEnabled) {
        return null; // 설정이 없거나 스케줄러가 비활성화된 경우
      }
      
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      
      // 출근 시간 (지연 포함)
      const [checkInHour, checkInMinute] = settings.checkInTime.split(':').map(Number);
      const checkInTimeInMinutes = checkInHour * 60 + checkInMinute + (settings.checkInDelay || 0);
      
      // 퇴근 시간 (지연 포함)
      const [checkOutHour, checkOutMinute] = settings.checkOutTime.split(':').map(Number);
      const checkOutTimeInMinutes = checkOutHour * 60 + checkOutMinute + (settings.checkOutDelay || 0);
      
      // 허용 오차 범위 (5분)
      const TOLERANCE_MINUTES = 5;
      
      // 현재 시간이 출근 시간과 일치하는지 확인
      if (Math.abs(currentTimeInMinutes - checkInTimeInMinutes) <= TOLERANCE_MINUTES) {
        // 출근 시간이면 출근 실행
        return await SchedulerService.executeForUser(userId, 'checkIn');
      }
      
      // 현재 시간이 퇴근 시간과 일치하는지 확인
      if (Math.abs(currentTimeInMinutes - checkOutTimeInMinutes) <= TOLERANCE_MINUTES) {
        // 퇴근 시간이면 퇴근 실행
        return await SchedulerService.executeForUser(userId, 'checkOut');
      }
      
      return null; // 실행할 작업 없음
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError(`사용자 ${userId}의 예약 작업 확인 중 오류 발생:`, errorMessage);
      return { 
        success: false, 
        message: `예약 작업 확인 중 오류가 발생했습니다: ${errorMessage}` 
      };
    }
  }
  
  /**
   * 모든 사용자에 대해 예약된 작업을 확인하고 실행합니다.
   */
  static async checkAndExecuteForAllUsers(): Promise<void> {
    try {
      // 1. 스케줄러가 활성화된 모든 사용자 가져오기
      const usersWithSettings = await prisma.user.findMany({
        where: {
          settings: {
            schedulerEnabled: true
          }
        },
        include: {
          settings: true
        }
      });
      
      if (usersWithSettings.length === 0) {
        logInfo('스케줄러가 활성화된 사용자가 없습니다.');
        return;
      }
      
      logInfo(`${usersWithSettings.length}명의 사용자에 대해 예약 작업을 확인합니다.`);
      
      // 2. 각 사용자에 대해 작업 실행
      for (const user of usersWithSettings) {
        const result = await SchedulerService.checkAndExecuteScheduledAction(user.id);
        
        if (result) {
          if (result.success) {
            logSuccess(`사용자 ${user.email || user.id}의 작업이 성공적으로 실행되었습니다: ${result.message}`);
          } else {
            logWarning(`사용자 ${user.email || user.id}의 작업 실행 중 문제가 발생했습니다: ${result.message}`);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('모든 사용자의 예약 작업 확인 중 오류 발생:', errorMessage);
    }
  }
}
