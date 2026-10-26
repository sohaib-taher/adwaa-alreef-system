'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'

const T = {
  title: 'حركة المبيعات (شبكة وكاش)',
  print: '🖨️ طباعة',
  export: '📥 تصدير Excel',
  day: 'اليوم',
  date: 'التاريخ',
  dakhilNetwork: 'شبكة الدخل',
  dakhilCash: 'كاش الدخل',
  nasiriyaNetwork: 'شبكة الناصرية',
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
        grouped[date] = { date, dakhilNet: 0, dakhilCash: 0, nasiriyaNet: 0, nasiriyaCash: 0 }
      })

      revenues?.forEach(rev => {
        const branchName = (rev.branches as any)?.name || (rev.branches as any)?.[0]?.name || ''
        if (grouped[rev.revenue_date]) {
          if (branchName.includes('الدخل')) {
            grouped[rev.revenue_date].dakhilNet += Number(rev.network_amount) || 0
            grouped[rev.revenue_date].dakhilCash += Number(rev.cash_amount) || 0
          }
          if (branchName.includes('الناصرية')) {
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
    dakhilNet: acc.dakhilNet + row.dakhilNet, dakhilCash: acc.dakhilCash + row.dakhilCash,
    nasiriyaNet: acc.nasiriyaNet + row.nasiriyaNet, nasiriyaCash: acc.nasiriyaCash + row.nasiriyaCash,
  }), { dakhilNet: 0, dakhilCash: 0, nasiriyaNet: 0, nasiriyaCash: 0 })

  const totalNetwork = totals.dakhilNet + totals.nasiriyaNet
  const totalCash = totals.dakhilCash + totals.nasiriyaCash
  const totalDakhil = totals.dakhilNet + totals.dakhilCash
  const totalNasiriya = totals.nasiriyaNet + totals.nasiriyaCash

  const handleExport = () => {
    const excelData = reportData.map((row, i) => ({
      'اليوم': T.days[i],
      'التاريخ': row.date,
      'شبكة الدخل': row.dakhilNet,
      'كاش الدخل': row.dakhilCash,
      'شبكة الناصرية': row.nasiriyaNet,
      'كاش الناصرية': row.nasiriyaCash
    }))
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "حركة المبيعات")
    XLSX.writeFile(wb, `حركة_المبيعات_${weekDates[0]}.xlsx`)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', overflowX: 'auto' }}>
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#1e3a8a', fontSize: '24px', margin: 0 }}>{T.title}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} style={btnStyle('#059669')}>{T.print}</button>
          <button onClick={handleExport} style={btnStyle('#2563eb')}>{T.export}</button>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', whiteSpace: 'nowrap', marginBottom: '20px' }}>
        <thead>
          <tr style={{ background: '#1e3a8a', color: 'white' }}>
            <th style={thStyle}>{T.day}</th><th style={thStyle}>{T.date}</th>
            <th style={thStyle}>{T.dakhilNetwork}</th><th style={thStyle}>{T.dakhilCash}</th>
            <th style={thStyle}>{T.nasiriyaNetwork}</th><th style={thStyle}>{T.nasiriyaCash}</th>
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
        <div style={summaryRowStyle('#f3e8ff')}><div style={summaryLabelStyle}>{T.totalNetwork}</div><div style={summaryValueStyle}>{totalNetwork.toFixed(2)}</div></div>
        <div style={summaryRowStyle('#f3e8ff')}><div style={summaryLabelStyle}>{T.totalCash}</div><div style={summaryValueStyle}>{totalCash.toFixed(2)}</div></div>
        <div style={summaryRowStyle('#fef08a')}><div style={summaryLabelStyle}>{T.totalDakhil}</div><div style={summaryValueStyle}>{totalDakhil.toFixed(2)}</div></div>
        <div style={summaryRowStyle('#fef08a')}><div style={summaryLabelStyle}>{T.totalNasiriya}</div><div style={summaryValueStyle}>{totalNasiriya.toFixed(2)}</div></div>
      </div>

      <style jsx global>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          body { background: white !important; }
          table { font-size: 11px !important; }
        }
      `}</style>
    </div>
  )
}

export default function SalesMovementPage() {
  return <Suspense fallback={<div>جاري التحميل...</div>}><SalesMovementContent /></Suspense>
}

const thStyle: React.CSSProperties = { padding: '12px', border: '1px solid #1e40af', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }
const summaryRowStyle = (bgColor: string): React.CSSProperties => ({ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', background: bgColor, fontWeight: 'bold', borderRadius: '4px' })
const summaryLabelStyle: React.CSSProperties = { fontSize: '14px', color: '#111827' }
const summaryValueStyle: React.CSSProperties = { fontSize: '14px', color: '#111827' }
const btnStyle = (bg: string): React.CSSProperties => ({ padding: '10px 20px', background: bg, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' })