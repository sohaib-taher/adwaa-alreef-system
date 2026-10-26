'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  title: 'تقرير بلال (الخضار)',
  date: 'التاريخ',
  cashDakhil: 'كاش مع بلال (الدخل)',
  purchDakhil: 'مشتريات (الدخل)',
  remDakhil: 'باقي على (الدخل)',
  cashNasiriya: 'كاش مع بلال (الناصرية)',
  purchNasiriya: 'مشتريات (الناصرية)',
  remNasiriya: 'باقي (الناصرية)',
  totalPurch: 'إجمالي مشتريات الفرعين',
  totals: 'الإجمالي',
  summaryTitle: 'الملخص المالي لبلال',
  prevDebt: 'باقي من مديونية سابقة',
  purchases: 'مشتريات (الخضار)',
  totalDue: 'المديونية السابقة + مشتريات',
  paymentsTitle: 'سداد بلال (نقداً / بنك)',
  cashPayment: 'سداد بلال نقدا',
  bankPayment1: 'سداد من البنك',
  finalDebt: 'مديونية بلال الحالية',
  noData: 'لا توجد بيانات مسجلة',
  loading: 'جاري التحميل...',
  sar: 'ر.س'
}

function BilalReportContent() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any[]>([])
  
  const [fixedValues, setFixedValues] = useState({
    prevDebt: 0,
    cashPayment: 0,
    bankPayment1: 50000 // قيمة تجريبية للسدادات، يمكن تعديلها
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase.from('users').select('company_id').eq('auth_id', user.id).single()
      if (!userData) return

      // جلب مشتريات الخضار فقط
      const { data: receipts } = await supabase
        .from('daily_receipts')
        .select(`
          receipt_date,
          daily_receipt_items (
            unit_price,
            receipt_branch_allocations ( sent_qty, branches(name) )
          )
        `)
        .eq('category_type', 'vegetable')
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

  const totalDue = fixedValues.prevDebt + totalPurchases
  const totalPayments = fixedValues.cashPayment + fixedValues.bankPayment1
  const finalDebt = totalDue - totalPayments

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', overflowX: 'auto' }}>
      
      <h1 style={{ color: '#1e3a8a', fontSize: '24px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>{T.title}</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', whiteSpace: 'nowrap', marginBottom: '20px' }}>
        <thead>
          <tr style={{ background: '#1e3a8a', color: 'white' }}>
            <th style={thStyle}>{T.date}</th>
            <th style={thStyle}>{T.cashDakhil}</th>
            <th style={thStyle}>{T.purchDakhil}</th>
            <th style={thStyle}>{T.remDakhil}</th>
            <th style={thStyle}>{T.cashNasiriya}</th>
            <th style={thStyle}>{T.purchNasiriya}</th>
            <th style={thStyle}>{T.remNasiriya}</th>
            <th style={{...thStyle, background: '#ca8a04'}}>{T.totalPurch}</th>
          </tr>
        </thead>
        <tbody>
          {reportData.length === 0 ? (
            <tr><td colSpan={8} style={{ padding: '20px', color: '#6b7280' }}>{T.noData}</td></tr>
          ) : (
            reportData.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{row.date}</td>
                <td style={tdStyle}>-</td>
                <td style={tdStyle}>{row.dakhil.toFixed(2)}</td>
                <td style={tdStyle}>-</td>
                <td style={tdStyle}>-</td>
                <td style={tdStyle}>{row.nasiriya.toFixed(2)}</td>
                <td style={tdStyle}>-</td>
                <td style={{...tdStyle, background: '#fef08a', fontWeight: 'bold'}}>{(row.dakhil + row.nasiriya).toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: '#facc15', fontWeight: 'bold', color: '#000' }}>
            <td style={tdStyle}>{T.totals}</td>
            <td style={tdStyle}>-</td>
            <td style={tdStyle}>{totalDakhil.toFixed(2)}</td>
            <td style={tdStyle}>-</td>
            <td style={tdStyle}>-</td>
            <td style={tdStyle}>{totalNasiriya.toFixed(2)}</td>
            <td style={tdStyle}>-</td>
            <td style={tdStyle}>{totalPurchases.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#e5e7eb', color: '#111827' }}>
              <th colSpan={2} style={thStyle}>{T.summaryTitle}</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ccc' }}><td style={tdStyle}>{T.prevDebt}</td><td style={tdStyle}>{fixedValues.prevDebt} {T.sar}</td></tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}><td style={tdStyle}>{T.purchases}</td><td style={tdStyle}>{totalPurchases.toFixed(2)} {T.sar}</td></tr>
            <tr style={{ borderBottom: '2px solid #000', background: '#fde047', fontWeight: 'bold' }}><td style={tdStyle}>{T.totalDue}</td><td style={tdStyle}>{totalDue.toFixed(2)} {T.sar}</td></tr>
          </tbody>
        </table>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#e5e7eb', color: '#111827' }}>
              <th colSpan={2} style={thStyle}>{T.paymentsTitle}</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ccc' }}><td style={tdStyle}>{T.cashPayment}</td><td style={tdStyle}>{fixedValues.cashPayment} {T.sar}</td></tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}><td style={tdStyle}>{T.bankPayment1}</td><td style={tdStyle}>{fixedValues.bankPayment1} {T.sar}</td></tr>
            <tr style={{ borderBottom: '2px solid #000', background: '#fde047', fontWeight: 'bold' }}><td style={tdStyle}>{T.finalDebt}</td><td style={tdStyle}>{finalDebt.toFixed(2)} {T.sar}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function BilalReportPage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <BilalReportContent />
    </Suspense>
  )
}

const thStyle: React.CSSProperties = { padding: '10px', border: '1px solid #1e40af', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }