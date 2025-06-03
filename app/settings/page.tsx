'use client'

import { SettingsForm } from '@/components/settings-form'
import { Header } from '@/components/header'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">서비스 설정</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Jobcan 자동 출퇴근 설정을 관리하세요</p>
          </div>
          
          {status === 'loading' ? (
            <div className="space-y-6">
              <Skeleton className="h-[240px] w-full rounded-lg" />
              <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
          ) : session ? (
            <SettingsForm />
          ) : null}
        </div>
      </div>
    </div>
  )
}