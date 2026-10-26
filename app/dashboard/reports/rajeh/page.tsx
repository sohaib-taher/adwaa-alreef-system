'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  title: 'تقرير الورقيات - عبده راجح',
  date: 'التاريخ',
  cashDakhil: 'كاش مع راجح (الدخل)',
  purchDakhil: 'مشتريات (الدخل)',
  remDakhil: 'باقي على (الدخل)',
  cashNasiriya: 'كاش مع راجح (الناصري)',
  purchNasiriya: 'مشتريات (الناصرية)',
  remNasiriya: 'باقي (الناصرية)',
  totalPurch: 'إجمالي مشتريات الفرعين',
  totalCash: 'إجمالي كاش الفرعين',
  totals: 'الإجمالي', // <--- هذا هو السطر الذي كان ناقصاً
  dateTaj: 'التاريخ',
  cashTaj: 'كاش مع راجح (التاج)',
  purchTaj: 'مشتريات (التاج)',
  remTaj: 'باقي على (التاج)',
  prevDebt: 'باقي مديونية سابقة',
  increase: 'زيادة في المديونية',
  netDebt: 'صافي المديونية',
  noData: 'لا توجد بيانات',
  loading: 'جاري التحميل...',
  sar: 'ر.س'
}

function RajehReportContent() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase.from('users').select('company_id').eq('auth_id', user.id).single()
      if (!userData) return

      // جلب استلامات الورقيات فقط
      const { data: receipts } = await supabase
        .from('daily_receipts')
        .select(`
          receipt_date,
          daily_receipt_items (
            unit_price,
            receipt_branch_allocations ( sent_qty, branches(name) )
          )
        `)
        .eq('category_type', 'paper')
        .eq('company_id', userData.company_id)
        .order('receipt_date', { ascending: true })

      const groupedData: any = {}
      receipts?.forEach(receipt => {
        const date = receipt.receipt_date
        if (!groupedData[date]) {
          groupedData[date] = { date, dakhil: 0, nasiriya: 0, taj: 0 }
        }

        receipt.daily_receipt_items?.forEach((item: any) => {
          item.receipt_branch_allocations?.forEach((alloc: any) => {
            const branchName = (alloc.branches as any)?.name || (alloc.branches as any)?.[0]?.name || ''
            const total = (Number(alloc.sent_qty) || 0) * (Number(item.unit_price) || 0)

            if (branchName.includes('الدخل')) groupedData[date].dakhil += total
            if (branchName.includes('الناصرية')) groupedData[date].nasiriya += total
            if (branchName.includes('التاج') || branchName.includes('تاج')) groupedData[date].taj += total
          })
        })
      })

      setReportData(Object.values(groupedData))
      setLoading(false)
    }
    loadData()
  }, [])

  const totals = reportData.reduce((acc, row: any) => ({
    dakhil: acc.dakhil + row.dakhil,
    nasiriya: acc.nasiriya + row.nasiriya,
    taj: acc.taj + row.taj,
    totalPurch: acc.totalPurch + row.dakhil + row.nasiriya,
  }), { dakhil: 0, nasiriya: 0, taj: 0, totalPurch: 0 })

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', overflowX: 'auto' }}>
      
      <h1 style={{ color: '#1e3a8a', fontSize: '24px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>{T.title}</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', whiteSpace: 'nowrap', marginBottom: '20px' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: 'white' }}>
            {/* قسم الدخل والناصرية */}
            <th style={thStyle}>{T.date}</th>
            <th style={thStyle}>{T.cashDakhil}</th>
            <th style={thStyle}>{T.purchDakhil}</th>
            <th style={thStyle}>{T.remDakhil}</th>
            <th style={thStyle}>{T.cashNasiriya}</th>
            <th style={thStyle}>{T.purchNasiriya}</th>
            <th style={thStyle}>{T.remNasiriya}</th>
            <th style={{...thStyle, background: '#1e3a8a'}}>{T.totalPurch}</th>
            <th style={{...thStyle, background: '#1e3a8a'}}>{T.totalCash}</th>
            <th style={{...thStyle, background: '#334155'}}></th>
            {/* قسم التاج */}
            <th style={thStyle}>{T.dateTaj}</th>
            <th style={thStyle}>{T.cashTaj}</th>
            <th style={thStyle}>{T.purchTaj}</th>
            <th style={thStyle}>{T.remTaj}</th>
          </tr>
        </thead>
        <tbody>
          {reportData.length === 0 ? (
            <tr><td colSpan={14} style={{ padding: '20px', color: '#6b7280' }}>{T.noData}</td></tr>
          ) : (
            reportData.map((row, i) => {
              const remDakhil = 0 - row.dakhil
              const remNasiriya = 0 - row.nasiriya
              const remTaj = 0 - row.taj

              return (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>{row.date}</td>
                  <td style={tdStyle}>-</td>
                  <td style={tdStyle}>{row.dakhil.toFixed(2)}</td>
                  <td style={{...tdStyle, color: '#dc2626'}}>{remDakhil.toFixed(2)}</td>
                  <td style={tdStyle}>-</td>
                  <td style={tdStyle}>{row.nasiriya.toFixed(2)}</td>
                  <td style={{...tdStyle, color: '#dc2626'}}>{remNasiriya.toFixed(2)}</td>
                  <td style={{...tdStyle, background: '#fef08a', fontWeight: 'bold'}}>{(row.dakhil + row.nasiriya).toFixed(2)}</td>
                  <td style={{...tdStyle, background: '#fef08a', fontWeight: 'bold'}}>-</td>
                  <td style={{...tdStyle, background: '#e2e8f0'}}></td>
                  <td style={tdStyle}>{row.date}</td>
                  <td style={tdStyle}>-</td>
                  <td style={tdStyle}>{row.taj.toFixed(2)}</td>
                  <td style={{...tdStyle, color: '#dc2626'}}>{remTaj.toFixed(2)}</td>
                </tr>
              )
            })
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: '#facc15', fontWeight: 'bold', color: '#000' }}>
            <td colSpan={2} style={tdStyle}>{T.totals}</td>
            <td style={tdStyle}>{totals.dakhil.toFixed(2)}</td>
            <td style={tdStyle}>-</td>
            <td style={tdStyle}>-</td>
            <td style={tdStyle}>{totals.nasiriya.toFixed(2)}</td>
            <td style={tdStyle}>-</td>
            <td style={tdStyle}>{totals.totalPurch.toFixed(2)}</td>
            <td style={tdStyle}>-</td>
            <td style={{...tdStyle, background: '#e2e8f0'}}></td>
            <td colSpan={3} style={tdStyle}>-</td>
            <td style={tdStyle}>{totals.taj.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {/* ملخص المديونية (3 أقسام) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
        
        <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#065f46' }}>مديونية الدخل</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}><span>{T.prevDebt} (06-09):</span> <span>-776.00</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}><span>{T.increase}:</span> <span>{totals.dakhil.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', borderTop: '1px solid #ccc', paddingTop: '5px' }}><span>{T.netDebt}:</span> <span>{(totals.dakhil - 776).toFixed(2)}</span></div>
        </div>

        <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#065f46' }}>مديونية الناصرية</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}><span>{T.prevDebt} (06-09):</span> <span>11906.00</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}><span>{T.increase}:</span> <span>{totals.nasiriya.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', borderTop: '1px solid #ccc', paddingTop: '5px' }}><span>{T.netDebt}:</span> <span>{(totals.nasiriya + 11906).toFixed(2)}</span></div>
        </div>

        <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#065f46' }}>مديونية التاج</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}><span>{T.prevDebt} (06-09):</span> <span>-1994.00</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}><span>{T.increase}:</span> <span>{totals.taj.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', borderTop: '1px solid #ccc', paddingTop: '5px' }}><span>{T.netDebt}:</span> <span>{(totals.taj - 1994).toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  )
}

export default function RajehReportPage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <RajehReportContent />
    </Suspense>
  )
}

const thStyle: React.CSSProperties = { padding: '10px', border: '1px solid #1e40af', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }