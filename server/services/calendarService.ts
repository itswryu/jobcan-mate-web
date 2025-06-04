import { logInfo, logError, logWarning } from '../utils/logger';
import { Settings } from '@prisma/client';

export interface CalendarConfig {
  annualLeaveCalendarUrl: string;
  annualLeaveKeyword: string;
  holidayCalendarUrl?: string;
}

export interface OffDayInfo {
  type: 'annualLeave' | 'publicHoliday';
  name: string;
}

export class CalendarService {
  private config: CalendarConfig;

  constructor(settings: Settings) {
    this.config = {
      annualLeaveCalendarUrl: settings.annualLeaveCalendarUrl,
      annualLeaveKeyword: settings.annualLeaveKeyword,
      holidayCalendarUrl: 'https://calendar.google.com/calendar/ical/ko.south_korea%23holiday%40group.v.calendar.google.com/public/basic.ics'
    };
  }

  /**
   * 오늘이 연차 휴가인지 확인합니다.
   * @returns 연차 휴가면 휴가 이름을 반환하고, 아니면 false를 반환합니다.
   */
  async isTodayAnnualLeave(): Promise<string | false> {
    if (!this.config.annualLeaveCalendarUrl || !this.config.annualLeaveKeyword) {
      logInfo('Annual leave calendar URL or keyword not provided. Skipping annual leave check.');
      return false;
    }

    try {
      logInfo(`Fetching annual leave events from: ${this.config.annualLeaveCalendarUrl}`);
      const response = await fetch(this.config.annualLeaveCalendarUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch annual leave calendar: ${response.statusText}`);
      }
      
      const icalData = await response.text();
      const events = this.parseICalData(icalData);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const event of events) {
        if (event.type === 'VEVENT' && event.summary) {
          const startDate = new Date(event.start);
          startDate.setHours(0, 0, 0, 0);

          // 이벤트가 오늘이고 요약에 키워드가 포함되어 있는지 확인
          if (startDate.getTime() === currentDate.getTime() && 
              event.summary.includes(this.config.annualLeaveKeyword)) {
            const eventName = event.summary;
            logInfo(`Today (${currentDate.toISOString().split('T')[0]}) is an annual leave day: ${eventName}`);
            return eventName;
          }
        }
      }
      
      logInfo(`Today (${currentDate.toISOString().split('T')[0]}) is not an annual leave day.`);
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('Error checking for annual leave:', errorMessage);
      return false; // 오류 발생 시 연차가 아닌 것으로 가정
    }
  }

  /**
   * 오늘이 공휴일인지 확인합니다.
   * @returns 공휴일이면 공휴일 이름을 반환하고, 아니면 false를 반환합니다.
   */
  async isTodayPublicHoliday(): Promise<string | false> {
    if (!this.config.holidayCalendarUrl) {
      logInfo('Holiday calendar URL not provided. Skipping holiday check.');
      return false;
    }

    try {
      logInfo(`Fetching holidays from: ${this.config.holidayCalendarUrl}`);
      const response = await fetch(this.config.holidayCalendarUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch holiday calendar: ${response.statusText}`);
      }
      
      const icalData = await response.text();
      const events = this.parseICalData(icalData);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const event of events) {
        if (event.type === 'VEVENT') {
          const startDate = new Date(event.start);
          startDate.setHours(0, 0, 0, 0);

          if (startDate.getTime() === currentDate.getTime()) {
            const holidayName = event.summary || '이름 없는 공휴일';
            logInfo(`Today (${currentDate.toISOString().split('T')[0]}) is a public holiday: ${holidayName}`);
            return holidayName;
          }
        }
      }
      
      logInfo(`Today (${currentDate.toISOString().split('T')[0]}) is not a public holiday.`);
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('Error checking for public holidays:', errorMessage);
      return false;
    }
  }

  /**
   * 오늘이 휴일(연차 또는 공휴일)인지 확인합니다.
   * 연차가 공휴일보다 우선합니다.
   * @returns 휴일이면 타입과 이름이 포함된 객체를 반환하고, 아니면 false를 반환합니다.
   */
  async checkIfTodayIsOffDay(): Promise<OffDayInfo | false> {
    // 연차 확인 (URL이 제공된 경우에만)
    if (this.config.annualLeaveCalendarUrl && this.config.annualLeaveCalendarUrl.trim() !== '') {
      const annualLeaveName = await this.isTodayAnnualLeave();
      if (annualLeaveName) {
        return { type: 'annualLeave', name: annualLeaveName };
      }
    } else {
      logInfo('Annual leave calendar URL is not configured. Skipping annual leave check.');
    }

    // 공휴일 확인
    const publicHolidayName = await this.isTodayPublicHoliday();
    if (publicHolidayName) {
      return { type: 'publicHoliday', name: publicHolidayName };
    }

    return false;
  }

  /**
   * 오늘이 평일인지 확인합니다.
   * @param weekdaysOnly 평일만 확인할지 여부
   * @returns 오늘이 출근 가능한 날이면 true, 아니면 false
   */
  async isTodayWorkday(weekdaysOnly: boolean): Promise<boolean> {
    // 오늘이 휴일인지 확인
    const offDayInfo = await this.checkIfTodayIsOffDay();
    if (offDayInfo) {
      logInfo(`Today is an off day: ${offDayInfo.type} - ${offDayInfo.name}`);
      return false;
    }

    // weekdaysOnly가 true이면 주말인지 확인
    if (weekdaysOnly) {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0: 일요일, 6: 토요일
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        logInfo('Today is a weekend. Not a workday.');
        return false;
      }
    }

    logInfo('Today is a workday.');
    return true;
  }

  // iCal 데이터를 파싱하는 도우미 함수
  private parseICalData(icalData: string): any[] {
    const events: any[] = [];
    const lines = icalData.split(/\r\n|\n|\r/);
    
    let currentEvent: any = null;
    let currentProperty = '';
    
    for (let line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = { type: 'VEVENT' };
      } else if (line.startsWith('END:VEVENT')) {
        if (currentEvent) {
          events.push(currentEvent);
          currentEvent = null;
        }
      } else if (currentEvent) {
        if (line.startsWith(' ') && currentProperty) {
          // 줄 접기 처리 (긴 내용이 여러 줄로 나뉜 경우)
          currentEvent[currentProperty] += line.substring(1);
        } else {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex);
            const value = line.substring(colonIndex + 1);
            
            // 간단한 속성 매핑
            if (key === 'SUMMARY') {
              currentEvent.summary = value;
              currentProperty = 'summary';
            } else if (key === 'DTSTART' || key.startsWith('DTSTART;')) {
              currentEvent.start = this.parseICalDate(value);
              currentProperty = 'start';
            } else if (key === 'DTEND' || key.startsWith('DTEND;')) {
              currentEvent.end = this.parseICalDate(value);
              currentProperty = 'end';
            } else {
              currentProperty = '';
            }
          }
        }
      }
    }
    
    return events;
  }

  // iCal 날짜 문자열을 JavaScript Date 객체로 변환
  private parseICalDate(dateString: string): Date {
    // yyyyMMddTHHmmssZ 형식 처리
    if (/^\d{8}T\d{6}Z$/.test(dateString)) {
      const year = parseInt(dateString.substring(0, 4));
      const month = parseInt(dateString.substring(4, 6)) - 1; // JavaScript 월은 0부터 시작
      const day = parseInt(dateString.substring(6, 8));
      const hour = parseInt(dateString.substring(9, 11));
      const minute = parseInt(dateString.substring(11, 13));
      const second = parseInt(dateString.substring(13, 15));
      
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }
    
    // yyyyMMdd 형식 처리
    if (/^\d{8}$/.test(dateString)) {
      const year = parseInt(dateString.substring(0, 4));
      const month = parseInt(dateString.substring(4, 6)) - 1;
      const day = parseInt(dateString.substring(6, 8));
      
      return new Date(year, month, day);
    }
    
    // 표준 ISO 형식은 그대로 파싱
    return new Date(dateString);
  }
}
