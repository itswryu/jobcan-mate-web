'use client'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await signIn('google', { callbackUrl: '/settings' })
    } catch (error) {
      console.error('Login failed:', error)
      setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md">
      {error && (
        <Alert variant="destructive" className="mb-4 w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>로그인 오류</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-2 text-xs">
            <p>다음 해결 방법을 시도해 보세요:</p>
            <ul className="list-disc pl-5 mt-1">
              <li>브라우저를 새로고침 한 후 다시 시도</li>
              <li>쿠키 및 캐시 삭제 후 다시 시도</li>
              <li>다른 브라우저로 시도</li>
            </ul>
          </div>
        </Alert>
      )}
      
      <Button 
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full max-w-xs bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-3 h-12 rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
        variant="outline"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            로그인 중...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 로그인
          </>
        )}
      </Button>
      
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
        <p>로그인 문제가 지속되면 데이터베이스 초기화를 시도해 주세요:</p>
        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1 inline-block">
          npm run force-reset-db
        </code>
      </div>
    </div>
  )
}