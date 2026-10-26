'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const T = {
  mainTitle: 'لوحة التحكم الرئيسية',
  subTitle: 'نظرة عامة وإدارة النظام',
  dailyOps: 'العمليات اليومية',
  receiptVeg: 'استلام خضار',
  receiptFruit: 'استلام فواكه',
  receiptPaper: 'استلام ورقيات',
  workerConfirm: 'تأكيد استلام العمال',
  workerApproval: 'اعتماد الإدارة',
  revenues: 'الإيرادات اليومية',
  purchases: 'فواتير المشتريات',
  transfers: 'التحويلات',
  debts: 'المديونيات',
  reports: 'التقارير والمناديب',
  weeklyReport: 'التقرير الأسبوعي',
  salesMovement: 'حركة المبيعات',
  jaber: 'تقرير جابر',
  bilal: 'تقرير بلال',
  rajeh: 'تقرير عبده راجح',
  admin: 'الإدارة والإعدادات',
  branches: 'الفروع',
  products: 'الأصناف',
  users: 'المستخدمون',
  settings: 'الإعدادات'
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then((res) => {
      if (!res.data.session) window.location.href = '/'
      else setLoading(false)
    })
  }, [])

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#059669' }}>جاري التحميل...</div>

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#065f46', fontSize: '28px', margin: '0 0 10px' }}>{T.mainTitle}</h1>
        <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>{T.subTitle}</p>
      </div>

      <h2 style={{ color: '#374151', fontSize: '20px', marginBottom: '15px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>{T.dailyOps}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginBottom: '40px' }}>
        <Link href="/dashboard/daily-receipts?type=vegetable" style={cardStyle}><span style={{ fontSize: '35px' }}>🥬</span><span style={titleStyle}>{T.receiptVeg}</span></Link>
        <Link href="/dashboard/daily-receipts?type=fruit" style={cardStyle}><span style={{ fontSize: '35px' }}>🍎</span><span style={titleStyle}>{T.receiptFruit}</span></Link>
        <Link href="/dashboard/daily-receipts?type=paper" style={cardStyle}><span style={{ fontSize: '35px' }}>📄</span><span style={titleStyle}>{T.receiptPaper}</span></Link>
        <Link href="/dashboard/worker-confirm" style={cardStyle}><span style={{ fontSize: '35px' }}>👷‍♂️</span><span style={titleStyle}>{T.workerConfirm}</span></Link>
        <Link href="/dashboard/worker-approval" style={cardStyle}><span style={{ fontSize: '35px' }}>✅</span><span style={titleStyle}>{T.workerApproval}</span></Link>
        <Link href="/dashboard/revenues" style={cardStyle}><span style={{ fontSize: '35px' }}>💰</span><span style={titleStyle}>{T.revenues}</span></Link>
        <Link href="/dashboard/purchases" style={cardStyle}><span style={{ fontSize: '35px' }}>🧾</span><span style={titleStyle}>{T.purchases}</span></Link>
        <Link href="/dashboard/transfers" style={cardStyle}><span style={{ fontSize: '35px' }}>🔄</span><span style={titleStyle}>{T.transfers}</span></Link>
        <Link href="/dashboard/debts" style={cardStyle}><span style={{ fontSize: '35px' }}>📋</span><span style={titleStyle}>{T.debts}</span></Link>
      </div>

      <h2 style={{ color: '#374151', fontSize: '20px', marginBottom: '15px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>{T.reports}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginBottom: '40px' }}>
        <Link href="/dashboard/reports/weekly" style={cardStyle}><span style={{ fontSize: '35px' }}>📊</span><span style={titleStyle}>{T.weeklyReport}</span></Link>
        <Link href="/dashboard/reports/sales-movement" style={cardStyle}><span style={{ fontSize: '35px' }}>📈</span><span style={titleStyle}>{T.salesMovement}</span></Link>
        <Link href="/dashboard/reports/jaber" style={cardStyle}><span style={{ fontSize: '35px' }}>👨‍💼</span><span style={titleStyle}>{T.jaber}</span></Link>
        <Link href="/dashboard/reports/bilal" style={cardStyle}><span style={{ fontSize: '35px' }}>🚚</span><span style={titleStyle}>{T.bilal}</span></Link>
        <Link href="/dashboard/reports/rajeh" style={cardStyle}><span style={{ fontSize: '35px' }}>📦</span><span style={titleStyle}>{T.rajeh}</span></Link>
      </div>

      <h2 style={{ color: '#374151', fontSize: '20px', marginBottom: '15px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>{T.admin}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
        <Link href="/dashboard/branches" style={cardStyle}><span style={{ fontSize: '35px' }}>🏬</span><span style={titleStyle}>{T.branches}</span></Link>
        <Link href="/dashboard/products" style={cardStyle}><span style={{ fontSize: '35px' }}>🍏</span><span style={titleStyle}>{T.products}</span></Link>
        <Link href="/dashboard/users" style={cardStyle}><span style={{ fontSize: '35px' }}>👥</span><span style={titleStyle}>{T.users}</span></Link>
        <Link href="/dashboard/settings" style={cardStyle}><span style={{ fontSize: '35px' }}>⚙️</span><span style={titleStyle}>{T.settings}</span></Link>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  background: 'white', padding: '20px 10px', borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', textDecoration: 'none',
  border: '1px solid #f3f4f6', transition: 'transform 0.2s'
}

const titleStyle: React.CSSProperties = {
  color: '#1f2937', fontWeight: 'bold', fontSize: '14px', textAlign: 'center', marginTop: '10px'
}