'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const T = {
  mainTitle: '\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629',
  dailyOps: '\u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629',
  receiptVeg: '\u0627\u0633\u062A\u0644\u0627\u0645 \u062E\u0636\u0627\u0631',
  receiptFruit: '\u0627\u0633\u062A\u0644\u0627\u0645 \u0641\u0648\u0627\u0643\u0647',
  receiptPaper: '\u0627\u0633\u062A\u0644\u0627\u0645 \u0648\u0631\u0642\u064A\u0627\u062A',
  workerConfirm: '\u062A\u0623\u0643\u064A\u062F \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0639\u0645\u0627\u0644',
  revenues: '\u0627\u0644\u0625\u064A\u0631\u0627\u062F\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629',
  purchases: '\u0641\u0648\u0627\u062A\u064A\u0631 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A',
  reports: '\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0648\u0627\u0644\u0645\u0646\u0627\u062F\u0628\u064A\u0646',
  weeklyReport: '\u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064A',
  jaber: '\u062A\u0642\u0631\u064A\u0631 \u062C\u0627\u0628\u0631',
  bilal: '\u062A\u0642\u0631\u064A\u0631 \u0628\u0644\u0627\u0644',
  rajeh: '\u062A\u0642\u0631\u064A\u0631 \u0639\u0628\u062F\u0647 \u0631\u0627\u062C\u062D',
  admin: '\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0648\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A',
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

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#059669' }}>...</div>

  return (
    <div style={{ padding: '10px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#065f46', fontSize: '28px', margin: '0 0 10px' }}>{T.mainTitle}</h1>
      </div>

      <h2 style={{ color: '#374151', fontSize: '20px', marginBottom: '15px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>{T.dailyOps}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <Link href="/dashboard/daily-receipts?type=vegetable" style={cardStyle}>
          <span style={{ fontSize: '40px', marginBottom: '10px' }}>🥬</span>
          <span style={titleStyle}>{T.receiptVeg}</span>
        </Link>
        <Link href="/dashboard/daily-receipts?type=fruit" style={cardStyle}>
          <span style={{ fontSize: '40px', marginBottom: '10px' }}>🍎</span>
          <span style={titleStyle}>{T.receiptFruit}</span>
        </Link>
        <Link href="/dashboard/daily-receipts?type=paper" style={cardStyle}>
          <span style={{ fontSize: '40px', marginBottom: '10px' }}>📄</span>
          <span style={titleStyle}>{T.receiptPaper}</span>
        </Link>
        <Link href="/dashboard/worker-confirm" style={cardStyle}>
          <span style={{ fontSize: '40px', marginBottom: '10px' }}>👷‍♂️</span>
          <span style={titleStyle}>{T.workerConfirm}</span>
        </Link>
        <Link href="/dashboard/revenues" style={cardStyle}>
          <span style={{ fontSize: '40px', marginBottom: '10px' }}>💰</span>
          <span style={titleStyle}>{T.revenues}</span>
        </Link>
        <Link href="/dashboard/purchases" style={cardStyle}>
          <span style={{ fontSize: '40px', marginBottom: '10px' }}>🧾</span>
          <span style={titleStyle}>{T.purchases}</span>
        </Link>
      </div>

      <h2 style={{ color: '#374151', fontSize: '20px', marginBottom: '15px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>{T.reports}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        <Link href="/dashboard/reports/weekly" style={cardStyle}>
          <span style={{ fontSize: '40px', marginBottom: '10px' }}>📊</span>
          <span style={titleStyle}>{T.weeklyReport}</span>
        </Link>
        <Link href="/dashboard/reports/jaber" style={cardStyle}>
          <span style={{ fontSize: '40px', marginBottom: '10px' }}>👨‍💼</span>
          <span style={titleStyle}>{T.jaber}</span>
        </Link>
        <Link href="/dashboard/reports/bilal" style={cardStyle}>
          <span style={{ fontSize: '40px', marginBottom: '10px' }}>🚚</span>
          <span style={titleStyle}>{T.bilal}</span>
        </Link>
        <Link href="/dashboard/reports/rajeh" style={cardStyle}>
          <span style={{ fontSize: '40px', marginBottom: '10px' }}>📦</span>
          <span style={titleStyle}>{T.rajeh}</span>
        </Link>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'white',
  padding: '30px 20px',
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  textDecoration: 'none',
  border: '1px solid #f3f4f6',
  transition: 'transform 0.2s'
}

const titleStyle: React.CSSProperties = {
  color: '#1f2937',
  fontWeight: 'bold',
  fontSize: '16px',
  textAlign: 'center'
}