'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  title: 'تقرير جابر (الفواكه)',
  date: 'التاريخ',
  purchDakhil: 'مشتريات (الدخل)',
  purchNasiriya: 'مشتريات (الناصرية)',
  totalPurch: 'إجمالي مشتريات الفرعين',
  totals: 'الإجمالي',
  summaryTitle: 'الملخص المالي لجابر',
  prevDebt: 'باقي من مديونية سابقة',
  purchases: 'مشتريات (الفواكه)',
  payments: 'إجمالي السداد',
  finalDebt: 'المديونية الحالية',
  noData: 'لا توجد بيانات مسجلة',
  loading: 'جاري التحميل...',
  sar: 'ر.س'
}

function JaberReportContent() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any[]>([])
  const [summary, setSummary] = useState({
    prevDebt: 0, purchases: 0, payments: 0
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase.from('users').select('company_id').eq('auth_id', user.id).single()
      if (!userData) return

      // 1. جلب المشتريات (فواكه فقط)
      const { data: receipts } = await supabase
        .from('daily_receipts')
        .select(`
          receipt_date,
          daily_receipt_items (
            unit_price,
            receipt_branch_allocations ( sent_qty, branches(name) )
          )
        `)
        .eq('category_type', 'fruit')
        .eq('company_id', userData.company_id)
        .order('receipt_date', { ascending: true })

      // 2. جلب المديونيات والسدادات لجابر
      const { data: jaberDebts } = await supabase
        .from('debts')
        .select('amount, type')
        .eq('party_name', 'جابر')
        .eq('company_id', userData.company_id)

      // 3. تجميع بيانات الجدول
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

      const result = Object.values(groupedData)
      setReportData(result)

      // 4. حساب الملخص المالي
      const totalPurchases = result.reduce((sum, day: any) => sum + Number(day.dakhil) + Number(day.nasiriya), 0)
      
      let totalDebt = 0
      let totalPayments = 0
      jaberDebts?.forEach(d => {
        if (d.type === 'debit') totalDebt += Number(d.amount)
        if (d.type === 'credit') totalPayments += Number(d.amount)
      })

      setSummary({
        prevDebt: 0, // يمكن تعديله لاحقاً لو كان هناك رصيد افتتاحي
        purchases: totalPurchases,
        payments: totalPayments
      })

      setLoading(false)
    }
    loadData()
  }, [])

  const totals = reportData.reduce((acc, row: any) => ({
    dakhil: acc.dakhil + row.dakhil,
    nasiriya: acc.nasiriya + row.nasiriya,
    total: acc.total + row.dakhil + row.nasiriya
  }), { dakhil: 0, nasiriya: 0, total: 0 })

  // المعادلة: المديونية الحالية = (السابقة + المشتريات) - السداد
  const currentDebt = (summary.prevDebt + summary.purchases) - summary.payments

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', overflowX: 'auto' }}>
      
      <h1 style={{ color: '#1e3a8a', fontSize: '24px', marginBottom: '20px' }}>{T.title}</h1>

      {/* الجدول الرئيسي */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', whiteSpace: 'nowrap', marginBottom: '30px' }}>
        <thead>
          <tr style={{ background: '#1e3a8a', color: 'white' }}>
            <th style={thStyle}>{T.date}</th>
            <th style={thStyle}>{T.purchDakhil}</th>
            <th style={thStyle}>{T.purchNasiriya}</th>
            <th style={{...thStyle, background: '#ca8a04'}}>{T.totalPurch}</th>
          </tr>
        </thead>
        <tbody>
          {reportData.length === 0 ? (
            <tr><td colSpan={4} style={{ padding: '20px', color: '#6b7280' }}>{T.noData}</td></tr>
          ) : (
            reportData.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{row.date}</td>
                <td style={tdStyle}>{row.dakhil.toFixed(2)}</td>
                <td style={tdStyle}>{row.nasiriya.toFixed(2)}</td>
                <td style={{...tdStyle, background: '#fef08a', fontWeight: 'bold'}}>{(row.dakhil + row.nasiriya).toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: '#facc15', fontWeight: 'bold', color: '#000' }}>
            <td style={tdStyle}>{T.totals}</td>
            <td style={tdStyle}>{totals.dakhil.toFixed(2)}</td>
            <td style={tdStyle}>{totals.nasiriya.toFixed(2)}</td>
            <td style={tdStyle}>{totals.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {/* جدول الملخص المالي */}
      <table style={{ width: '100%', maxWidth: '600px', borderCollapse: 'collapse', fontSize: '14px', margin: '0 auto' }}>
        <thead>
          <tr style={{ background: '#e5e7eb', color: '#111827' }}>
            <th colSpan={2} style={thStyle}>{T.summaryTitle}</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #ccc' }}><td style={tdStyle}>{T.prevDebt}</td><td style={tdStyle}>{summary.prevDebt.toFixed(2)} {T.sar}</td></tr>
          <tr style={{ borderBottom: '1px solid #ccc' }}><td style={tdStyle}>{T.purchases}</td><td style={tdStyle}>{summary.purchases.toFixed(2)} {T.sar}</td></tr>
          <tr style={{ borderBottom: '1px solid #ccc', background: '#dcfce7' }}><td style={tdStyle}>{T.payments}</td><td style={tdStyle}>{summary.payments.toFixed(2)} {T.sar}</td></tr>
          
          <tr style={{ borderBottom: '2px solid #000', background: '#fde047', fontWeight: 'bold', fontSize: '16px' }}>
            <td style={tdStyle}>{T.finalDebt}</td>
            <td style={tdStyle}>{currentDebt.toFixed(2)} {T.sar}</td>
          </tr>
        </tbody>
      </table>

    </div>
  )
}

export default function JaberReportPage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <JaberReportContent />
    </Suspense>
  )
}

const thStyle: React.CSSProperties = { padding: '12px', border: '1px solid #1e40af', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }