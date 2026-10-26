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
  dateTaj: 'التاريخ',
  cashTaj: 'كاش مع راجح (التاج)',
  purchTaj: 'مشتريات (التاج)',
  remTaj: 'باقي على (التاج)',
  summary: 'ملخص المديونية',
  prevDebt: 'باقي مديونية سابقة',
  increase: 'زيادة في المديونية',
  netDebt: 'صافي المديونية',
  noData: 'لا توجد بيانات',
  loading: 'جاري التحميل...',
}

function RajehReportContent() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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
        .order('receipt_date', { ascending: true })

      const groupedData: any = {}

      receipts?.forEach(receipt => {
        const date = receipt.receipt_date
        if (!groupedData[date]) {
          groupedData[date] = { date, dakhil: 0, nasiriya: 0, taj: 0, cashDakhil: 0, cashNasiriya: 0, cashTaj: 0 }
        }

        receipt.daily_receipt_items?.forEach((item: any) => {
          item.receipt_branch_allocations?.forEach((alloc: any) => {
            const branchName = alloc.branches?.name || ''
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

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', overflowX: 'auto' }}>
      
      <h1 style={{ color: '#1e3a8a', fontSize: '24px', marginBottom: '20px', textAlign: 'center' }}>{T.title}</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', whiteSpace: 'nowrap' }}>
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
              const remDakhil = row.cashDakhil - row.dakhil
              const remNasiriya = row.cashNasiriya - row.nasiriya
              const remTaj = row.cashTaj - row.taj
              const totalPurch = row.dakhil + row.nasiriya
              const totalCash = row.cashDakhil + row.cashNasiriya

              return (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>{row.date}</td>
                  <td style={tdStyle}>{row.cashDakhil}</td>
                  <td style={tdStyle}>{row.dakhil.toFixed(2)}</td>
                  <td style={{...tdStyle, color: remDakhil < 0 ? '#dc2626' : '#059669'}}>{remDakhil.toFixed(2)}</td>
                  
                  <td style={tdStyle}>{row.cashNasiriya}</td>
                  <td style={tdStyle}>{row.nasiriya.toFixed(2)}</td>
                  <td style={{...tdStyle, color: remNasiriya < 0 ? '#dc2626' : '#059669'}}>{remNasiriya.toFixed(2)}</td>
                  
                  <td style={{...tdStyle, background: '#fef08a', fontWeight: 'bold'}}>{totalPurch.toFixed(2)}</td>
                  <td style={{...tdStyle, background: '#fef08a', fontWeight: 'bold'}}>{totalCash.toFixed(2)}</td>
                  
                  <td style={{...tdStyle, background: '#e2e8f0'}}></td>
                  
                  <td style={tdStyle}>{row.date}</td>
                  <td style={tdStyle}>{row.cashTaj}</td>
                  <td style={tdStyle}>{row.taj.toFixed(2)}</td>
                  <td style={{...tdStyle, color: remTaj < 0 ? '#dc2626' : '#059669'}}>{remTaj.toFixed(2)}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {/* ملخص المديونية (يمكن تعديل الأرقام يدوياً هنا لاحقاً بناءً على رصيد افتتاحي) */}
      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
        
        <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '250px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#065f46' }}>مديونية الدخل</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
            <span>{T.prevDebt} (06-09):</span> <span>-776.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
            <span>{T.increase}:</span> <span>0.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', borderTop: '1px solid #ccc', paddingTop: '5px' }}>
            <span>{T.netDebt}:</span> <span>-776.00</span>
          </div>
        </div>

        <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '250px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#065f46' }}>مديونية الناصرية</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
            <span>{T.prevDebt} (06-09):</span> <span>11906.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
            <span>{T.increase}:</span> <span>0.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', borderTop: '1px solid #ccc', paddingTop: '5px' }}>
            <span>{T.netDebt}:</span> <span>11906.00</span>
          </div>
        </div>

        <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '250px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#065f46' }}>مديونية التاج</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
            <span>{T.prevDebt} (06-09):</span> <span>-1994.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
            <span>{T.increase}:</span> <span>0.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', borderTop: '1px solid #ccc', paddingTop: '5px' }}>
            <span>{T.netDebt}:</span> <span>-1994.00</span>
          </div>
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