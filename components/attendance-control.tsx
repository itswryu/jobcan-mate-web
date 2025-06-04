'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, LogIn, LogOut, Calendar, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

/**
 * 출퇴근 컨트롤 패널 컴포넌트
 * 사용자가 수동으로 출근/퇴근을 할 수 있는 버튼 제공
 */
export function AttendanceControl() {
  const [isLoading, setIsLoading] = useState(false)
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null)
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

  // 컴포넌트 초기화 시 스케줄러 상태 조회
  React.useEffect(() => {
    fetchSchedulerStatus()
  }, [])

  // 출근/퇴근 작업 실행
  const executeAction = async (action: 'checkIn' | 'checkOut' | 'auto') => {
    setIsLoading(true)
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
      // 작업 완료 후 상태 갱신
      fetchSchedulerStatus()
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          출퇴근 관리
        </CardTitle>
        <CardDescription>수동으로 출근 또는 퇴근을 기록하거나 예약된 작업 정보를 확인합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {schedulerStatus ? (
            <div className="grid gap-2">
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
                    <div className="mt-2 rounded-md bg-yellow-50 p-2 text-sm text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      테스트 모드가 활성화되어 있습니다. 출퇴근 버튼은 실제로 Jobcan에 기록되지 않습니다.
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
            variant="outline"
            size="sm"
            onClick={() => fetchSchedulerStatus()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => executeAction('checkIn')}
            disabled={isLoading}
          >
            <LogIn className="mr-2 h-4 w-4" />
            출근하기
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => executeAction('checkOut')}
            disabled={isLoading}
          >
            <LogOut className="mr-2 h-4 w-4" />
            퇴근하기
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
