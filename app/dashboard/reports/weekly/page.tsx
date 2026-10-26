'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient()
        // استخدام getSession أسرع وأكثر أماناً من getUser
        const { data, error } = await supabase.auth.getSession()
        
        if (error || !data.session) {
          window.location.href = '/'
        }
      } catch (err) {
        console.error("Auth error:", err)
        // حتى لو فشل الاتصال، لا نعلق الشاشة
      } finally {
        // هذا السطر يضمن إخفاء كلمة "جاري التحميل" مهما حدث
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', color: '#059669', fontSize: '18px' }}>جاري التحقق من الدخول...</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#065f46', fontSize: '28px', margin: '0 0 10px' }}>لوحة التحكم الرئيسية</h1>
        <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>نظرة عامة وإدارة النظام</p>
      </div>

      {/* العمليات اليومية */}
      <h2 style={{ color: '#374151', fontSize: '20px', marginBottom: '15px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>العمليات اليومية</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginBottom: '40px' }}>
        <Link href="/dashboard/daily-receipts?type=vegetable" style={cardStyle}><span style={{ fontSize: '35px' }}>🥬</span><span style={titleStyle}>استلام خضار</span></Link>
        <Link href="/dashboard/daily-receipts?type=fruit" style={cardStyle}><span style={{ fontSize: '35px' }}>🍎</span><span style={titleStyle}>استلام فواكه</span></Link>
        <Link href="/dashboard/daily-receipts?type=paper" style={cardStyle}><span style={{ fontSize: '35px' }}>📄</span><span style={titleStyle}>استلام ورقيات</span></Link>
        <Link href="/dashboard/worker-confirm" style={cardStyle}><span style={{ fontSize: '35px' }}>👷‍♂️</span><span style={titleStyle}>تأكيد استلام العمال</span></Link>
        <Link href="/dashboard/worker-approval" style={cardStyle}><span style={{ fontSize: '35px' }}>✅</span><span style={titleStyle}>اعتماد الإدارة</span></Link>
        <Link href="/dashboard/revenues" style={cardStyle}><span style={{ fontSize: '35px' }}>💰</span><span style={titleStyle}>الإيرادات اليومية</span></Link>
        <Link href="/dashboard/purchases" style={cardStyle}><span style={{ fontSize: '35px' }}>🧾</span><span style={titleStyle}>فواتير المشتريات</span></Link>
        <Link href="/dashboard/transfers" style={cardStyle}><span style={{ fontSize: '35px' }}>🔄</span><span style={titleStyle}>التحويلات</span></Link>
        <Link href="/dashboard/debts" style={cardStyle}><span style={{ fontSize: '35px' }}>📋</span><span style={titleStyle}>المديونيات</span></Link>
      </div>

      {/* التقارير */}
      <h2 style={{ color: '#374151', fontSize: '20px', marginBottom: '15px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>التقارير والمناديب</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginBottom: '40px' }}>
        <Link href="/dashboard/reports/weekly" style={cardStyle}><span style={{ fontSize: '35px' }}>📊</span><span style={titleStyle}>التقرير الأسبوعي</span></Link>
        <Link href="/dashboard/reports/sales-movement" style={cardStyle}><span style={{ fontSize: '35px' }}>📈</span><span style={titleStyle}>حركة المبيعات</span></Link>
        <Link href="/dashboard/reports/jaber" style={cardStyle}><span style={{ fontSize: '35px' }}>👨‍💼</span><span style={titleStyle}>تقرير جابر</span></Link>
        <Link href="/dashboard/reports/bilal" style={cardStyle}><span style={{ fontSize: '35px' }}>🚚</span><span style={titleStyle}>تقرير بلال</span></Link>
        <Link href="/dashboard/reports/rajeh" style={cardStyle}><span style={{ fontSize: '35px' }}>📦</span><span style={titleStyle}>تقرير راجح</span></Link>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  background: 'white', padding: '20px 10px', borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', textDecoration: 'none',
  border: '1px solid #f3f4f6'
}

const titleStyle: React.CSSProperties = {
  color: '#1f2937', fontWeight: 'bold', fontSize: '14px', textAlign: 'center', marginTop: '10px'
}