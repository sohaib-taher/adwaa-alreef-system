'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // توجيه تلقائي مباشر إلى لوحة التحكم
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans" dir="rtl">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        <p className="text-sm font-medium text-emerald-800">جاري الدخول إلى لوحة التحكم...</p>
      </div>
    </div>
  )
}