import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 시간 변환 유틸리티
export function formatTime(time: string): string {
  try {
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes), 0)
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  } catch (error) {
    return time
  }
}

// 지연 시간 표시 유틸리티
export function formatDelay(minutes: number): string {
  if (minutes === 0) {
    return '정시'
  }
  
  if (minutes < 0) {
    return `${Math.abs(minutes)}분 일찍`
  }
  
  return `${minutes}분 늦게`
}

// 타임존 목록
export const TIMEZONES = [
  { value: 'Asia/Seoul', label: '서울 (UTC+9)' },
  { value: 'Asia/Tokyo', label: '도쿄 (UTC+9)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: '런던 (UTC+0/+1)' },
  { value: 'America/New_York', label: '뉴욕 (UTC-5/-4)' },
  { value: 'America/Los_Angeles', label: '로스앤젤레스 (UTC-8/-7)' },
]