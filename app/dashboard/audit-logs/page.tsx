'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // 1. "مؤقت إنقاذ": إذا تأخر الاتصال، نفتح الشاشة قسرياً بعد 3 ثواني
    const timer = setTimeout(() => {
      if (isMounted && loading) {
        console.log('انتهى وقت الانتظار، فتح الشاشة قسرياً')
        setLoading(false)
      }
    }, 3000)

    // 2. جلب البيانات
    async function init() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          window.location.href = '/'
          return
        }
      } catch (err) {
        console.error(err)
      } finally {
        clearTimeout(timer) // إلغاء المؤقت إذا نجح الاتصال
        if (isMounted) setLoading(false) // إغلاق التحميل
      }
    }

    init()
    return () => { isMounted = false; clearTimeout(timer) }
  }, [])

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', fontSize: '18px', color: '#065f46' }}>جاري التحميل...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#065f46' }}>مرحباً بك في لوحة التحكم</h1>
      <p>النظام يعمل الآن بشكل سليم. اختر صفحة من القائمة.</p>
    </div>
  )
}