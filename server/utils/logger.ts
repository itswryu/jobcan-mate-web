/**
 * 로깅 유틸리티 함수들
 * 서버 측 로깅을 위한 간단한 유틸리티 모듈입니다.
 */

// 로그 레벨 색상 설정
const COLORS = {
  INFO: '\x1b[36m', // 청록색
  SUCCESS: '\x1b[32m', // 녹색
  WARNING: '\x1b[33m', // 노란색
  ERROR: '\x1b[31m', // 빨간색
  RESET: '\x1b[0m', // 리셋
};

/**
 * 정보 로그를 출력합니다.
 * @param message 기본 메시지
 * @param details 추가 세부사항 (선택적)
 */
export function logInfo(message: string, details?: any): void {
  const timestamp = new Date().toISOString();
  console.log(`${COLORS.INFO}[INFO]${COLORS.RESET} [${timestamp}] ${message}`, details !== undefined ? details : '');
}

/**
 * 성공 로그를 출력합니다.
 * @param message 기본 메시지
 * @param details 추가 세부사항 (선택적)
 */
export function logSuccess(message: string, details?: any): void {
  const timestamp = new Date().toISOString();
  console.log(`${COLORS.SUCCESS}[SUCCESS]${COLORS.RESET} [${timestamp}] ${message}`, details !== undefined ? details : '');
}

/**
 * 경고 로그를 출력합니다.
 * @param message 기본 메시지
 * @param details 추가 세부사항 (선택적)
 */
export function logWarning(message: string, details?: any): void {
  const timestamp = new Date().toISOString();
  console.warn(`${COLORS.WARNING}[WARNING]${COLORS.RESET} [${timestamp}] ${message}`, details !== undefined ? details : '');
}

/**
 * 오류 로그를 출력합니다.
 * @param message 기본 메시지
 * @param details 추가 세부사항 (선택적)
 */
export function logError(message: string, details?: any): void {
  const timestamp = new Date().toISOString();
  console.error(`${COLORS.ERROR}[ERROR]${COLORS.RESET} [${timestamp}] ${message}`, details !== undefined ? details : '');
}

/**
 * 로그를 파일에 저장하거나 외부 로깅 서비스로 전송하는 함수입니다.
 * 향후 확장성을 위해 준비된 함수입니다.
 * @param level 로그 레벨
 * @param message 로그 메시지
 * @param details 추가 세부사항
 */
export function saveLog(level: 'info' | 'success' | 'warning' | 'error', message: string, details?: any): void {
  // 향후 구현 예정
  // 파일에 저장하거나 외부 로깅 서비스로 전송하는 로직을 추가할 수 있습니다.
}
