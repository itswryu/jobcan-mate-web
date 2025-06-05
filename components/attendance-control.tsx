'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, LogIn, LogOut, Calendar, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast, useToast } from '@/hooks/use-toast'

/**
 * 출퇴근 컨트롤 패널 컴포넌트
 * 사용자가 수동으로 출근/퇴근을 할 수 있는 버튼 제공
 */
export function AttendanceControl() {
  const [isLoading, setIsLoading] = useState(false)
  const [actionType, setActionType] = useState<string | null>(null)
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null)
  const [workStatus, setWorkStatus] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const { toast } = useToast()

  // 스케줄러 상태 조회
  const fetchSchedulerStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/jobcan', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('상태 조회에 실패했습니다.')
      }

      const data = await response.json()
      if (data.success) {
        setSchedulerStatus(data.data)
      } else {
        toast({
          title: '스케줄러 상태 조회 실패',
          description: data.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '스케줄러 상태 조회 오류',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 출근 상태 확인
  const checkWorkStatus = async () => {
    setStatusLoading(true)
    try {
      const response = await fetch('/api/jobcan/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('출근 상태 확인에 실패했습니다.')
      }

      const data = await response.json()
      if (data.success) {
        setWorkStatus(data.status)
      } else {
        toast({
          title: '출근 상태 확인 실패',
          description: data.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      setWorkStatus('확인 불가')
      console.error('출근 상태 확인 오류:', error)
    } finally {
      setStatusLoading(false)
    }
  }

  // 컴포넌트 초기화 시 스케줄러 상태와 출근 상태 조회
  useEffect(() => {
    fetchSchedulerStatus()
    checkWorkStatus()
  }, [])

  // 출근/퇴근 작업 실행
  const executeAction = async (action: 'checkIn' | 'checkOut' | 'auto') => {
    setIsLoading(true)
    setActionType(action)
    try {
      const response = await fetch('/api/jobcan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('작업 실행에 실패했습니다.')
      }

      const data = await response.json()
      if (data.success) {
        toast({
          title: '작업 실행 성공',
          description: data.message,
        })
      } else {
        toast({
          title: '작업 실행 실패',
          description: data.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '작업 실행 오류',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setActionType(null)
      // 작업 완료 후 상태 갱신
      fetchSchedulerStatus()
      checkWorkStatus()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          출퇴근 상태
        </CardTitle>
        <CardDescription>자동 출퇴근 상태를 확인하고 수동으로 출퇴근을 기록할 수 있습니다.</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <div className="grid gap-4">
          {schedulerStatus ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">현재 근무 상태</span>
                {statusLoading ? (
                  <Badge variant="outline" className="animate-pulse">
                    확인 중...
                  </Badge>
                ) : workStatus === '근무중' ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    근무중
                  </Badge>
                ) : workStatus === '휴식중' ? (
                  <Badge variant="default" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                    휴식중
                  </Badge>
                ) : workStatus === '미출근' ? (
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    미출근
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    {workStatus || '알 수 없음'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">스케줄러 상태</span>
                <Badge variant={schedulerStatus.schedulerEnabled ? 'default' : 'outline'}>
                  {schedulerStatus.schedulerEnabled ? '활성화' : '비활성화'}
                </Badge>
              </div>
              {schedulerStatus.schedulerEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">출근 시간</span>
                    <span className="text-sm">{formatDate(schedulerStatus.checkInTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">퇴근 시간</span>
                    <span className="text-sm">{formatDate(schedulerStatus.checkOutTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">다음 예약 작업</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary">
                        {schedulerStatus.nextAction === 'checkIn' ? '출근' : '퇴근'}
                      </Badge>
                      <span className="text-sm">{formatDate(schedulerStatus.nextActionTime)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">근무일</span>
                    <Badge variant="outline">
                      {schedulerStatus.isWeekdaysOnly ? '평일만' : '모든 요일'}
                    </Badge>
                  </div>
                  {schedulerStatus.testMode && (
                    <div className="mt-4 rounded-md bg-red-50 p-4 text-sm font-semibold text-red-800 dark:bg-red-900/60 dark:text-red-200 border-2 border-red-300 dark:border-red-800 flex items-center gap-2 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>
                        테스트 모드가 활성화되어 있습니다. 출퇴근 버튼은 실제로 Jobcan에 기록되지 않습니다.
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex h-20 items-center justify-center">
              <RefreshCw className={`h-5 w-5 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchSchedulerStatus()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
        <div className="flex gap-2">
          {/* 출근 버튼: 미출근 상태일 때만 활성화 */}
          <Button
            variant={workStatus === '미출근' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (workStatus === '근무중') {
                toast({
                  title: '이미 출근 상태입니다',
                  description: '현재 근무중 상태이므로 출근을 다시 기록할 필요가 없습니다.',
                });
                return;
              }
              executeAction('checkIn');
            }}
            disabled={isLoading}
            className={`${actionType === 'checkIn' ? 'animate-pulse' : ''} ${
              workStatus === '근무중' 
                ? 'hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400 border-gray-300 dark:border-gray-700 opacity-90 dark:opacity-80' 
                : ''
            }`}
            title={workStatus === '근무중' ? '이미 출근 상태입니다' : ''}
          >
            {actionType === 'checkIn' ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                처리중...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                출근하기
              </>
            )}
          </Button>
          {/* 퇴근 버튼: 근무중 상태일 때만 활성화 */}
          <Button
            variant={workStatus === '근무중' ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              // 상태 검사
              if (workStatus === '미출근') {
                toast({
                  title: '출근 상태가 아닙니다',
                  description: '현재 출근하지 않은 상태이므로 퇴근을 기록할 수 없습니다.',
                });
                return;
              }
              if (workStatus === '휴식중') {
                toast({
                  title: '이미 퇴근 상태입니다',
                  description: '현재 휴식중 상태이므로 퇴근을 다시 기록할 필요가 없습니다.',
                });
                return;
              }
              
              // 퇴근 시간 전인지 확인
              if (schedulerStatus && workStatus === '근무중') {
                console.log('checkOutTime check - schedulerStatus:', JSON.stringify(schedulerStatus));
                
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const currentTimeInMinutes = currentHour * 60 + currentMinute;
                console.log('Current time:', `${currentHour}:${currentMinute}`, '(', currentTimeInMinutes, 'minutes )');
                
                try {
                  // 퇴근 시간 추출
                  // API 응답에서 퇴근 시간이 어떤 형식으로 오는지 확인
                  let checkOutHour = 18; // 기본값
                  let checkOutMinute = 0; // 기본값

                  // 시간 문자열 처리 (다양한 형식 처리)
                  const checkOutTimeStr = schedulerStatus.checkOutTime;
                  console.log('Raw checkOutTime value:', checkOutTimeStr);
                  
                  if (typeof checkOutTimeStr === 'string') {
                    // ISO 형식 (2023-01-01T18:00:00.000Z)
                    if (checkOutTimeStr.includes('T')) {
                      const date = new Date(checkOutTimeStr);
                      checkOutHour = date.getHours();
                      checkOutMinute = date.getMinutes();
                    } 
                    // HH:MM 형식 (18:00)
                    else if (checkOutTimeStr.includes(':')) {
                      const parts = checkOutTimeStr.split(':');
                      checkOutHour = parseInt(parts[0], 10);
                      checkOutMinute = parseInt(parts[1], 10);
                    }
                  }
                  
                  // 지연 시간 처리
                  const delay = schedulerStatus.checkOutDelay || 0;
                  console.log('Checkout delay:', delay, 'minutes');
                  
                  const checkOutTimeInMinutes = checkOutHour * 60 + checkOutMinute + delay;
                  console.log('Calculated checkout time:', `${Math.floor(checkOutTimeInMinutes/60)}:${checkOutTimeInMinutes%60}`, '(', checkOutTimeInMinutes, 'minutes )');
                  console.log('Time difference:', checkOutTimeInMinutes - currentTimeInMinutes, 'minutes');
                  
                  // 현재 시간이 퇴근 시간보다 일찍 이면 경고 (30분 이상 차이)
                  if (currentTimeInMinutes < checkOutTimeInMinutes - 30) {
                    const timeLeft = checkOutTimeInMinutes - currentTimeInMinutes;
                    const hoursLeft = Math.floor(timeLeft / 60);
                    const minutesLeft = timeLeft % 60;
                    const timeLeftText = hoursLeft > 0 
                      ? `${hoursLeft}시간 ${minutesLeft > 0 ? `${minutesLeft}분` : ''}` 
                      : `${minutesLeft}분`;
                    
                    console.log('Showing early checkout warning. Time left:', timeLeftText);
                    
                    // 경고 메시지 표시
                    const earlyCheckoutToast = toast({
                      title: '예정된 퇴근 시간보다 일찍 퇴근합니다',
                      description: `예정된 퇴근 시간까지 아직 ${timeLeftText} 남았습니다. 정말 지금 퇴근하시겠습니까?`,
                      action: (
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              // 토스트 닫기
                              earlyCheckoutToast.dismiss();
                            }}
                            size="sm"
                            className="flex-1 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                          >
                            취소하기
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => {
                              // 토스트 닫고 퇴근 처리
                              earlyCheckoutToast.dismiss();
                              executeAction('checkOut');
                            }}
                            size="sm"
                            className="flex-1"
                          >
                            퇴근 진행
                          </Button>
                        </div>
                      ),
                      className: "flex flex-col gap-4",  // 팝업 내용 간격 조정
                    });
                    return;
                  } else {
                    console.log('No warning needed. Within 30 minutes of checkout time or after checkout time.');
                  }
                } catch (error) {
                  console.error('Error during checkout time check:', error);
                  // 오류 발생 시 그냥 진행
                  executeAction('checkOut');
                  return;
                }
              }
              
              // 정상 진행
              executeAction('checkOut');
            }}
            disabled={isLoading}
            className={`${actionType === 'checkOut' ? 'animate-pulse' : ''} ${
              workStatus === '미출근' || workStatus === '휴식중' 
                ? 'hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400 border-gray-300 dark:border-gray-700 opacity-90 dark:opacity-80' 
                : ''
            }`}
            title={workStatus === '미출근' ? '출근 상태가 아닙니다' : workStatus === '휴식중' ? '이미 퇴근 상태입니다' : ''}
          >
            {actionType === 'checkOut' ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                처리중...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                퇴근하기
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
