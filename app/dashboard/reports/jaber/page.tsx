'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'

const T = {
  title: 'تقرير جابر (الفواكه)',
  print: '🖨️ طباعة',
  export: '📥 تصدير Excel',
  date: 'التاريخ',
  purchDakhil: 'مشتريات (الدخل)',
  purchNasiriya: 'مشتريات (الناصرية)',
  totalPurch: 'إجمالي مشتريات الفرعين',
  totals: 'الإجمالي',
  summaryTitle: 'الملخص المالي لجابر',
  prevDebt: 'باقي من مديونية سابقة',
  purchases: 'مشتريات',
  salary: 'راتب جابر',
  expenses: 'مخارج',
  totalDue: 'المديونية السابقة + مشتريات + راتب',
  paymentsTitle: 'سداد جابر (نقداً / بنك)',
  cashPayment: 'سداد جابر نقدا موسى',
  bankPayment1: 'سداد من البنك 18/10',
  bankPayment2: 'سداد من البنك 31/08',
  finalDebt: 'مديونية جابر الحالية',
  noData: 'لا توجد بيانات مسجلة',
  loading: 'جاري التحميل...',
  sar: 'ر.س'
}

function JaberReportContent() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any[]>([])
  
  const [fixedValues, setFixedValues] = useState({
    prevDebt: 0, salary: 3500, expenses: 500,
    cashPayment: 0, bankPayment1: 24600, bankPayment2: 85918
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userData } = await supabase.from('users').select('company_id').eq('auth_id', user.id).single()
      if (!userData) return

      const { data: receipts } = await supabase
        .from('daily_receipts')
        .select(`receipt_date, daily_receipt_items (unit_price, receipt_branch_allocations ( sent_qty, branches(name) ))`)
        .eq('category_type', 'fruit')
        .eq('company_id', userData.company_id)
        .order('receipt_date', { ascending: true })

      const groupedData: any = {}
      receipts?.forEach(receipt => {
        const date = receipt.receipt_date
        if (!groupedData[date]) groupedData[date] = { date, dakhil: 0, nasiriya: 0 }
        receipt.daily_receipt_items?.forEach((item: any) => {
          item.receipt_branch_allocations?.forEach((alloc: any) => {
            const branchName = (alloc.branches as any)?.name || (alloc.branches as any)?.[0]?.name || ''
            const total = (Number(alloc.sent_qty) || 0) * (Number(item.unit_price) || 0)
            if (branchName.includes('الدخل')) groupedData[date].dakhil += total
            if (branchName.includes('الناصرية')) groupedData[date].nasiriya += total
          })
        })
      })
      setReportData(Object.values(groupedData))
      setLoading(false)
    }
    loadData()
  }, [])

  const totalPurchases = reportData.reduce((sum, day: any) => sum + day.dakhil + day.nasiriya, 0)
  const totalDakhil = reportData.reduce((sum, day: any) => sum + day.dakhil, 0)
  const totalNasiriya = reportData.reduce((sum, day: any) => sum + day.nasiriya, 0)

  const totalDue = fixedValues.prevDebt + totalPurchases + fixedValues.salary + fixedValues.expenses
  const totalPayments = fixedValues.cashPayment + fixedValues.bankPayment1 + fixedValues.bankPayment2
  const finalDebt = totalDue - totalPayments

  const handleExport = () => {
    const excelData = reportData.map(row => ({
      'التاريخ': row.date,
      'مشتريات الدخل': row.dakhil,
      'مشتريات الناصرية': row.nasiriya,
      'إجمالي المشتريات': row.dakhil + row.nasiriya
    }))
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "تقرير جابر")
    XLSX.writeFile(wb, `تقرير_جابر_${new Date().toISOString().slice(0,10)}.xlsx`)
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
            <th style={thStyle}>{T.date}</th>
            <th style={thStyle}>{T.purchDakhil}</th>
            <th style={thStyle}>{T.purchNasiriya}</th>
            <th style={{...thStyle, background: '#ca8a04'}}>{T.totalPurch}</th>
          </tr>
        </thead>
        <tbody>
          {reportData.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={tdStyle}>{row.date}</td>
              <td style={tdStyle}>{row.dakhil.toFixed(2)}</td>
              <td style={tdStyle}>{row.nasiriya.toFixed(2)}</td>
              <td style={{...tdStyle, background: '#fef08a', fontWeight: 'bold'}}>{(row.dakhil + row.nasiriya).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#facc15', fontWeight: 'bold', color: '#000' }}>
            <td style={tdStyle}>{T.totals}</td>
            <td style={tdStyle}>{totalDakhil.toFixed(2)}</td>
            <td style={tdStyle}>{totalNasiriya.toFixed(2)}</td>
            <td style={tdStyle}>{totalPurchases.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead><tr style={{ background: '#e5e7eb', color: '#111827' }}><th colSpan={2} style={thStyle}>{T.summaryTitle}</th></tr></thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ccc' }}><td style={tdStyle}>{T.prevDebt}</td><td style={tdStyle}>{fixedValues.prevDebt} {T.sar}</td></tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}><td style={tdStyle}>{T.purchases}</td><td style={tdStyle}>{totalPurchases.toFixed(2)} {T.sar}</td></tr>
            <tr style={{ borderBottom: '1px solid #ccc', background: '#fef08a' }}><td style={tdStyle}>{T.salary}</td><td style={tdStyle}>{fixedValues.salary} {T.sar}</td></tr>
            <tr style={{ borderBottom: '1px solid #ccc', background: '#fef08a' }}><td style={tdStyle}>{T.expenses}</td><td style={tdStyle}>{fixedValues.expenses} {T.sar}</td></tr>
            <tr style={{ borderBottom: '2px solid #000', background: '#fde047', fontWeight: 'bold' }}><td style={tdStyle}>{T.totalDue}</td><td style={tdStyle}>{totalDue.toFixed(2)} {T.sar}</td></tr>
          </tbody>
        </table>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead><tr style={{ background: '#e5e7eb', color: '#111827' }}><th colSpan={2} style={thStyle}>{T.paymentsTitle}</th></tr></thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ccc' }}><td style={tdStyle}>{T.cashPayment}</td><td style={tdStyle}>{fixedValues.cashPayment} {T.sar}</td></tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}><td style={tdStyle}>{T.bankPayment1}</td><td style={tdStyle}>{fixedValues.bankPayment1} {T.sar}</td></tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}><td style={tdStyle}>{T.bankPayment2}</td><td style={tdStyle}>{fixedValues.bankPayment2} {T.sar}</td></tr>
            <tr style={{ borderBottom: '2px solid #000', background: '#fde047', fontWeight: 'bold' }}><td style={tdStyle}>{T.finalDebt}</td><td style={tdStyle}>{finalDebt.toFixed(2)} {T.sar}</td></tr>
          </tbody>
        </table>
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

export default function JaberReportPage() {
  return <Suspense fallback={<div>جاري التحميل...</div>}><JaberReportContent /></Suspense>
}

const thStyle: React.CSSProperties = { padding: '10px', border: '1px solid #1e40af', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }
const btnStyle = (bg: string): React.CSSProperties => ({ padding: '10px 20px', background: bg, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' })