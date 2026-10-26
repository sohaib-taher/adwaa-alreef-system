'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  title: 'حركة المبيعات (شبكة وكاش)',
  day: 'اليوم',
  date: 'التاريخ',
  dakhilNetwork: 'شبكة الدخل (بنك الأهلي)',
  dakhilCash: 'كاش الدخل',
  nasiriyaNetwork: 'شبكة الناصرية (بنك الأهلي)',
  nasiriyaCash: 'كاش الناصرية',
  totalNetwork: 'إجمالي شبكة الفرعين',
  totalCash: 'إجمالي كاش الفرعين',
  totalDakhil: 'إجمالي كاش + شبكة الدخل',
  totalNasiriya: 'إجمالي كاش + شبكة الناصرية',
  withdrawals: 'سحب الكاش',
  loading: 'جاري التحميل...',
  days: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']
}

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(today.setDate(diff))

  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function SalesMovementContent() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any[]>([])
  const weekDates = getWeekDates()

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase.from('users').select('company_id').eq('auth_id', user.id).single()
      if (!userData) return

      const { data: revenues } = await supabase
        .from('revenues')
        .select('revenue_date, network_amount, cash_amount, branches(name)')
        .in('revenue_date', weekDates)
        .eq('company_id', userData.company_id)

      const grouped: any = {}
      weekDates.forEach(date => {
        grouped[date] = {
          date,
          dakhilNet: 0, dakhilCash: 0,
          nasiriyaNet: 0, nasiriyaCash: 0
        }
      })

      revenues?.forEach(rev => {
        // معالجة مشكلة TypeScript مع العلاقات
        const branchName = (rev.branches as any)?.name || (rev.branches as any)?.[0]?.name || ''
        const isDakhil = branchName.includes('الدخل')
        const isNasiriya = branchName.includes('الناصرية')

        if (grouped[rev.revenue_date]) {
          if (isDakhil) {
            grouped[rev.revenue_date].dakhilNet += Number(rev.network_amount) || 0
            grouped[rev.revenue_date].dakhilCash += Number(rev.cash_amount) || 0
          }
          if (isNasiriya) {
            grouped[rev.revenue_date].nasiriyaNet += Number(rev.network_amount) || 0
            grouped[rev.revenue_date].nasiriyaCash += Number(rev.cash_amount) || 0
          }
        }
      })

      setReportData(weekDates.map(date => grouped[date]))
      setLoading(false)
    }
    loadData()
  }, [])

  const totals = reportData.reduce((acc, row) => ({
    dakhilNet: acc.dakhilNet + row.dakhilNet,
    dakhilCash: acc.dakhilCash + row.dakhilCash,
    nasiriyaNet: acc.nasiriyaNet + row.nasiriyaNet,
    nasiriyaCash: acc.nasiriyaCash + row.nasiriyaCash,
  }), { dakhilNet: 0, dakhilCash: 0, nasiriyaNet: 0, nasiriyaCash: 0 })

  const totalNetwork = totals.dakhilNet + totals.nasiriyaNet
  const totalCash = totals.dakhilCash + totals.nasiriyaCash
  const totalDakhil = totals.dakhilNet + totals.dakhilCash
  const totalNasiriya = totals.nasiriyaNet + totals.nasiriyaCash

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', overflowX: 'auto' }}>
      
      <h1 style={{ color: '#1e3a8a', fontSize: '24px', marginBottom: '20px', textAlign: 'center' }}>{T.title}</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', whiteSpace: 'nowrap', marginBottom: '20px' }}>
        <thead>
          <tr style={{ background: '#1e3a8a', color: 'white' }}>
            <th style={thStyle}>{T.day}</th>
            <th style={thStyle}>{T.date}</th>
            <th style={thStyle}>{T.dakhilNetwork}</th>
            <th style={thStyle}>{T.dakhilCash}</th>
            <th style={thStyle}>{T.nasiriyaNetwork}</th>
            <th style={thStyle}>{T.nasiriyaCash}</th>
          </tr>
        </thead>
        <tbody>
          {reportData.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
              <td style={{...tdStyle, fontWeight: 'bold'}}>{T.days[i]}</td>
              <td style={tdStyle}>{row.date}</td>
              <td style={tdStyle}>{row.dakhilNet > 0 ? row.dakhilNet.toFixed(2) : '-'}</td>
              <td style={tdStyle}>{row.dakhilCash > 0 ? row.dakhilCash.toFixed(2) : '-'}</td>
              <td style={tdStyle}>{row.nasiriyaNet > 0 ? row.nasiriyaNet.toFixed(2) : '-'}</td>
              <td style={tdStyle}>{row.nasiriyaCash > 0 ? row.nasiriyaCash.toFixed(2) : '-'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#fef08a', fontWeight: 'bold', color: '#000' }}>
            <td colSpan={2} style={tdStyle}>الإجمالي</td>
            <td style={tdStyle}>{totals.dakhilNet.toFixed(2)}</td>
            <td style={tdStyle}>{totals.dakhilCash.toFixed(2)}</td>
            <td style={tdStyle}>{totals.nasiriyaNet.toFixed(2)}</td>
            <td style={tdStyle}>{totals.nasiriyaCash.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={summaryRowStyle('#f3e8ff')}>
          <div style={summaryLabelStyle}>{T.totalNetwork}</div>
          <div style={summaryValueStyle}>{totalNetwork.toFixed(2)}</div>
        </div>
        <div style={summaryRowStyle('#f3e8ff')}>
          <div style={summaryLabelStyle}>{T.totalCash}</div>
          <div style={summaryValueStyle}>{totalCash.toFixed(2)}</div>
        </div>
        <div style={summaryRowStyle('#fef08a')}>
          <div style={summaryLabelStyle}>{T.totalDakhil}</div>
          <div style={summaryValueStyle}>{totalDakhil.toFixed(2)}</div>
        </div>
        <div style={summaryRowStyle('#fef08a')}>
          <div style={summaryLabelStyle}>{T.totalNasiriya}</div>
          <div style={summaryValueStyle}>{totalNasiriya.toFixed(2)}</div>
        </div>

        <div style={{ marginTop: '20px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ background: '#e5e7eb', padding: '10px', fontWeight: 'bold', textAlign: 'center' }}>{T.withdrawals}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #eee' }}><td style={tdStyle}>بلال من كاش الدخل</td><td style={tdStyle}>61000.00</td><td style={tdStyle}>بلال من كاش الناصرية</td><td style={tdStyle}>80650.00</td></tr>
              <tr style={{ borderBottom: '1px solid #eee' }}><td style={tdStyle}>عمال السوق</td><td style={tdStyle}>0.00</td><td style={tdStyle}>عمال السوق</td><td style={tdStyle}>0.00</td></tr>
              <tr style={{ borderBottom: '1px solid #eee' }}><td style={tdStyle}>عبده راجح من كاش الدخل</td><td style={tdStyle}>1150.00</td><td style={tdStyle}>عبده راجح من كاش الناصرية</td><td style={tdStyle}>7300.00</td></tr>
              <tr style={{ borderBottom: '1px solid #eee' }}><td style={tdStyle}>زين فواتير</td><td style={tdStyle}>0.00</td><td style={tdStyle}>زين فواتير</td><td style={tdStyle}>0.00</td></tr>
              <tr style={{ borderBottom: '1px solid #eee' }}><td style={tdStyle}>شراء بطاطس</td><td style={tdStyle}>0.00</td><td style={tdStyle}>شراء بطاطس</td><td style={tdStyle}>0.00</td></tr>
              <tr style={{ background: '#fca5a5', fontWeight: 'bold' }}><td style={tdStyle}>إجمالي سحب الكاش (الدخل)</td><td style={tdStyle}>62150.00</td><td style={tdStyle}>إجمالي سحب الكاش (الناصرية)</td><td style={tdStyle}>67600.00</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function SalesMovementPage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <SalesMovementContent />
    </Suspense>
  )
}

const thStyle: React.CSSProperties = { padding: '12px', border: '1px solid #1e40af', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }

const summaryRowStyle = (bgColor: string): React.CSSProperties => ({
  display: 'flex', justifyContent: 'space-between', padding: '10px 20px', background: bgColor, fontWeight: 'bold', borderRadius: '4px'
})
const summaryLabelStyle: React.CSSProperties = { fontSize: '14px', color: '#111827' }
const summaryValueStyle: React.CSSProperties = { fontSize: '14px', color: '#111827' }