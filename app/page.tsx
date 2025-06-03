'use client'

import { LoginForm } from '@/components/login-form'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader } from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/settings')
    }
  }, [status, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="w-full max-w-md px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
            Jobcan Mate
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10">자동 출퇴근 관리 서비스</p>
        </div>
        
        {status === 'loading' ? (
          <div className="flex justify-center items-center h-40">
            <Loader className="h-8 w-8 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <LoginForm />
        )}
      </div>
    </div>
  )
}