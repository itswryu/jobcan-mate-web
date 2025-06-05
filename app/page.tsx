'use client'

import { LoginForm } from '@/components/login-form'
import { AttendanceControl } from '@/components/attendance-control'
import { Header } from '@/components/header'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Loader } from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  // 로그인 상태가 아닐 때 로그인 페이지, 로그인 상태일 때 출퇴근 관리 페이지 표시
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-900">
      {status === 'authenticated' && <Header />}
      
      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader className="h-8 w-8 text-zinc-500 animate-spin" />
        </div>
      ) : status === 'authenticated' ? (
        // 로그인 상태: 출퇴근 관리 페이지
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Jobcan 대시보드</h1>
              <p className="text-zinc-600 dark:text-zinc-400">출퇴근 상태를 확인하고 관리하세요</p>
            </div>
            <AttendanceControl />
          </div>
        </div>
      ) : (
        // 로그인 상태가 아님: 로그인 페이지
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
          <div className="w-full max-w-md px-8 py-12">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                Jobcan Mate
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10">자동 출퇴근 관리 서비스</p>
            </div>
            <LoginForm />
          </div>
        </div>
      )}
    </div>
  )
}