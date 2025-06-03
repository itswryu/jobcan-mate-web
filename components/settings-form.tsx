'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Save, Eye, EyeOff, CheckCircle, AlertCircle, Clock, Calendar, Bell, Settings as SettingsIcon, Database, Bug } from 'lucide-react'

interface Settings {
  // Jobcan 계정 정보
  jobcanEmail: string
  jobcanPassword: string
  
  // 근무 시간 설정
  weekdaysOnly: boolean
  checkInTime: string
  checkOutTime: string
  
  // 스케줄러 설정
  schedulerEnabled: boolean
  checkInDelay: number
  checkOutDelay: number
  timezone: string
  
  // 앱 설정
  testMode: boolean
  messageLanguage: string
  
  // 텔레그램 알림 (선택사항)
  telegramBotToken: string
  telegramChatId: string
  
  // 연차 캘린더 (선택사항)
  annualLeaveCalendarUrl: string
  annualLeaveKeyword: string
}

export function SettingsForm() {
  const { data: session } = useSession()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [debugMode, setDebugMode] = useState(false)
  const [dbInfo, setDbInfo] = useState<any>(null)
  const [settings, setSettings] = useState<Settings>({
    jobcanEmail: '',
    jobcanPassword: '',
    weekdaysOnly: true,
    checkInTime: '08:00',
    checkOutTime: '17:00',
    schedulerEnabled: true,
    checkInDelay: -10,
    checkOutDelay: 5,
    timezone: 'Asia/Seoul',
    testMode: false,
    messageLanguage: 'ko',
    telegramBotToken: '',
    telegramChatId: '',
    annualLeaveCalendarUrl: '',
    annualLeaveKeyword: '연차'
  })

  // 설정 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        
        if (data.success && data.data) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error('설정 불러오기 오류:', error);
      }
    };
    
    if (session?.user?.id) {
      fetchSettings();
    }
  }, [session]);

  // 데이터베이스 정보 불러오기
  const fetchDbInfo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/db-check');
      const data = await response.json();
      
      if (data.success) {
        setDbInfo(data.data);
      }
    } catch (error) {
      console.error('DB 정보 불러오기 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true)
    setSaveStatus('idle')
    
    try {
      // API 호출로 설정 저장
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSaveStatus('success')
      } else {
        console.error('설정 저장 실패:', data.message);
        setSaveStatus('error')
      }
      
      // 3초 후 상태 초기화
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('설정 저장 오류:', error)
      setSaveStatus('error')
      // 3초 후 상태 초기화
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDirectSave = async () => {
    setIsLoading(true)
    setSaveStatus('idle')
    
    try {
      // 직접 저장 API 호출
      const response = await fetch('/api/db-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSaveStatus('success')
        setDbInfo(data.diagnostic);
      } else {
        console.error('직접 저장 실패:', data.message);
        setSaveStatus('error')
      }
      
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('직접 저장 오류:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span>계정 설정</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>근무 시간</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>알림 설정</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span>고급 설정</span>
          </TabsTrigger>
          {debugMode && (
            <TabsTrigger value="debug" className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
              <Bug className="h-4 w-4" />
              <span>디버그</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="account" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Jobcan 계정 정보</CardTitle>
              <CardDescription>
                자동 출퇴근에 사용될 Jobcan 계정 정보를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="jobcan-email">Jobcan 이메일</Label>
                <Input
                  id="jobcan-email"
                  type="email"
                  value={settings.jobcanEmail}
                  onChange={(e) => handleInputChange('jobcanEmail', e.target.value)}
                  placeholder="jobcan_email@example.com"
                  className="mt-1"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Jobcan에 로그인할 때 사용하는 이메일입니다</p>
              </div>
              
              <div>
                <Label htmlFor="password">Jobcan 비밀번호</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={settings.jobcanPassword}
                    onChange={(e) => handleInputChange('jobcanPassword', e.target.value)}
                    placeholder="Jobcan 비밀번호를 입력하세요"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}</span>
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Jobcan에 로그인할 때 사용하는 비밀번호입니다</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>근무 시간 설정</CardTitle>
              <CardDescription>
                출근 및 퇴근 시간을 설정하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="weekdays-only"
                  checked={settings.weekdaysOnly}
                  onCheckedChange={(checked) => handleInputChange('weekdaysOnly', checked)}
                />
                <Label htmlFor="weekdays-only">평일만 자동 출퇴근</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check-in-time">출근 시간</Label>
                  <Input
                    id="check-in-time"
                    type="time"
                    value={settings.checkInTime}
                    onChange={(e) => handleInputChange('checkInTime', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="check-out-time">퇴근 시간</Label>
                  <Input
                    id="check-out-time"
                    type="time"
                    value={settings.checkOutTime}
                    onChange={(e) => handleInputChange('checkOutTime', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check-in-delay">출근 지연시간 (분)</Label>
                  <Input
                    id="check-in-delay"
                    type="number"
                    value={settings.checkInDelay}
                    onChange={(e) => handleInputChange('checkInDelay', parseInt(e.target.value))}
                    placeholder="-10"
                    className="mt-1"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">음수: 일찍, 양수: 늦게</p>
                </div>
                <div>
                  <Label htmlFor="check-out-delay">퇴근 지연시간 (분)</Label>
                  <Input
                    id="check-out-delay"
                    type="number"
                    value={settings.checkOutDelay}
                    onChange={(e) => handleInputChange('checkOutDelay', parseInt(e.target.value))}
                    placeholder="5"
                    className="mt-1"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">음수: 일찍, 양수: 늦게</p>
                </div>
              </div>

              <div>
                <Label htmlFor="timezone">시간대</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => handleInputChange('timezone', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Seoul">Asia/Seoul</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>텔레그램 알림 설정</CardTitle>
              <CardDescription>
                출퇴근 알림을 받을 텔레그램 봇 정보를 입력하세요 (선택사항)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="telegram-bot-token">텔레그램 봇 토큰</Label>
                <Input
                  id="telegram-bot-token"
                  value={settings.telegramBotToken}
                  onChange={(e) => handleInputChange('telegramBotToken', e.target.value)}
                  placeholder="your_telegram_bot_token"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="telegram-chat-id">텔레그램 채팅 ID</Label>
                <Input
                  id="telegram-chat-id"
                  value={settings.telegramChatId}
                  onChange={(e) => handleInputChange('telegramChatId', e.target.value)}
                  placeholder="your_telegram_chat_id"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>연차 캘린더 설정</CardTitle>
              <CardDescription>
                연차 일정을 확인할 캘린더 URL을 입력하세요 (선택사항)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="annual-leave-url">연차 캘린더 URL (ICS 형식)</Label>
                <Input
                  id="annual-leave-url"
                  value={settings.annualLeaveCalendarUrl}
                  onChange={(e) => handleInputChange('annualLeaveCalendarUrl', e.target.value)}
                  placeholder="https://calendar.google.com/calendar/ical/..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="annual-leave-keyword">연차 키워드</Label>
                <Input
                  id="annual-leave-keyword"
                  value={settings.annualLeaveKeyword}
                  onChange={(e) => handleInputChange('annualLeaveKeyword', e.target.value)}
                  placeholder="연차"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>고급 설정</CardTitle>
              <CardDescription>
                개발자를 위한 고급 설정 옵션
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="scheduler-enabled"
                  checked={settings.schedulerEnabled}
                  onCheckedChange={(checked) => handleInputChange('schedulerEnabled', checked)}
                />
                <Label htmlFor="scheduler-enabled">자동 스케줄링 활성화</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="test-mode"
                  checked={settings.testMode}
                  onCheckedChange={(checked) => handleInputChange('testMode', checked)}
                />
                <Label htmlFor="test-mode">테스트 모드</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="debug-mode"
                  checked={debugMode}
                  onCheckedChange={(checked) => setDebugMode(checked)}
                />
                <Label htmlFor="debug-mode">디버그 모드</Label>
              </div>

              <div>
                <Label htmlFor="message-language">메시지 언어</Label>
                <Select
                  value={settings.messageLanguage}
                  onValueChange={(value) => handleInputChange('messageLanguage', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {debugMode && (
          <TabsContent value="debug" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>데이터베이스 디버깅</CardTitle>
                <CardDescription>
                  데이터베이스 상태 확인 및 직접 저장 테스트
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={fetchDbInfo}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    DB 상태 확인
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    onClick={handleDirectSave}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Bug className="h-4 w-4" />
                    직접 저장 테스트
                  </Button>
                </div>
                
                {dbInfo && (
                  <div className="mt-4 border rounded p-4 bg-gray-50 dark:bg-gray-900 overflow-auto max-h-96">
                    <h3 className="text-sm font-semibold mb-2">데이터베이스 정보</h3>
                    <pre className="text-xs">
                      {JSON.stringify(dbInfo, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <div className="flex justify-end items-center gap-4">
        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">설정이 저장되었습니다</span>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">저장에 실패했습니다</span>
          </div>
        )}
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </div>
  )
}