'use client'

import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // مجرد تأخير بسيط لظهور المحتوى، لا يوجد اتصال بقاعدة البيانات هنا
    setTimeout(() => setLoading(false), 500)
  }, [])

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#065f46' }}>جاري التحميل...</div>

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#065f46', fontSize: '24px' }}>مرحباً بك في لوحة التحكم</h1>
      <p style={{ color: '#6b7280' }}>النظام يعمل الآن. اختر صفحة من القائمة الجانبية.</p>
    </div>
  )
}