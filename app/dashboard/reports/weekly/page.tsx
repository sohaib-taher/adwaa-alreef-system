'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  title: 'التقرير الأسبوعي الشامل',
  day: 'اليوم',
  date: 'التاريخ',
  totalSales: 'إجمالي مبيعات الفرعين',
  totalPurch: 'إجمالي مشتريات الفرعين',
  dakhil: 'فرع الدخل المحدود',
  nasiriya: 'فرع الناصرية',
  fruit: 'مشتريات الفواكه',
  veg: 'مشتريات الخضار',
  paper: 'مشتريات الورقيات',
  sales: 'المبيعات',
  expenses: 'المصروفات',
  netSales: 'صافي المبيعات',
  totalRow: 'الإجمالي',
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

function WeeklyReportContent() {
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

      // 1. جلب الإيرادات (المبيعات والمصروفات)
      const { data: revenues } = await supabase
        .from('revenues')
        .select('revenue_date, network_amount, cash_amount, expenses, invoices, branches(name)')
        .in('revenue_date', weekDates)
        .eq('company_id', userData.company_id)

      // 2. جلب المشتريات (استلام الفواكه والخضار والورقيات)
      const { data: receipts } = await supabase
        .from('daily_receipts')
        .select(`
          receipt_date, category_type,
          daily_receipt_items (
            unit_price,
            receipt_branch_allocations ( sent_qty, branches(name) )
          )
        `)
        .in('receipt_date', weekDates)
        .eq('company_id', userData.company_id)

      const grouped: any = {}
      
      weekDates.forEach(date => {
        grouped[date] = {
          date,
          dakhil: { fruit: 0, veg: 0, paper: 0, sales: 0, expenses: 0, netSales: 0 },
          nasiriya: { fruit: 0, veg: 0, paper: 0, sales: 0, expenses: 0, netSales: 0 },
          totalSales: 0,
          totalPurch: 0
        }
      })

      // معالجة المبيعات
      revenues?.forEach(rev => {
        const branchName = (rev.branches as any)?.name || (rev.branches as any)?.[0]?.name || ''
        const isDakhil = branchName.includes('الدخل')
        const isNasiriya = branchName.includes('الناصرية')
        const target = isDakhil ? 'dakhil' : isNasiriya ? 'nasiriya' : null

        if (target && grouped[rev.revenue_date]) {
          // المبيعات = شبكة + كاش
          const sales = (Number(rev.network_amount) || 0) + (Number(rev.cash_amount) || 0)
          // المصروفات = مصروفات + فواتير
          const expenses = (Number(rev.expenses) || 0) + (Number(rev.invoices) || 0)
          
          grouped[rev.revenue_date][target].sales += sales
          grouped[rev.revenue_date][target].expenses += expenses
        }
      })

      // معالجة المشتريات
      receipts?.forEach(rec => {
        rec.daily_receipt_items?.forEach((item: any) => {
          item.receipt_branch_allocations?.forEach((alloc: any) => {
            const branchName = (alloc.branches as any)?.name || (alloc.branches as any)?.[0]?.name || ''
            const isDakhil = branchName.includes('الدخل')
            const isNasiriya = branchName.includes('الناصرية')
            const target = isDakhil ? 'dakhil' : isNasiriya ? 'nasiriya' : null
            
            if (target && grouped[rec.receipt_date]) {
              const amount = (Number(alloc.sent_qty) || 0) * (Number(item.unit_price) || 0)
              if (rec.category_type === 'fruit') grouped[rec.receipt_date][target].fruit += amount
              if (rec.category_type === 'vegetable') grouped[rec.receipt_date][target].veg += amount
              if (rec.category_type === 'paper') grouped[rec.receipt_date][target].paper += amount
            }
          })
        })
      })

      // الحسابات النهائية
      Object.values(grouped).forEach((day: any) => {
        day.dakhil.netSales = day.dakhil.sales - day.dakhil.expenses
        day.nasiriya.netSales = day.nasiriya.sales - day.nasiriya.expenses
        
        day.totalSales = day.dakhil.sales + day.nasiriya.sales
        day.totalPurch = day.dakhil.fruit + day.dakhil.veg + day.dakhil.paper + 
                         day.nasiriya.fruit + day.nasiriya.veg + day.nasiriya.paper
      })

      const result = weekDates.map(date => grouped[date])
      setReportData(result)
      setLoading(false)
    }
    loadData()
  }, [])

  const calculateTotals = () => {
    const t = { 
      dakhil: { fruit: 0, veg: 0, paper: 0, sales: 0, expenses: 0, netSales: 0 }, 
      nasiriya: { fruit: 0, veg: 0, paper: 0, sales: 0, expenses: 0, netSales: 0 }, 
      totalSales: 0, totalPurch: 0 
    }
    
    reportData.forEach(day => {
      t.dakhil.fruit += day.dakhil.fruit; t.dakhil.veg += day.dakhil.veg; t.dakhil.paper += day.dakhil.paper
      t.dakhil.sales += day.dakhil.sales; t.dakhil.expenses += day.dakhil.expenses; t.dakhil.netSales += day.dakhil.netSales
      
      t.nasiriya.fruit += day.nasiriya.fruit; t.nasiriya.veg += day.nasiriya.veg; t.nasiriya.paper += day.nasiriya.paper
      t.nasiriya.sales += day.nasiriya.sales; t.nasiriya.expenses += day.nasiriya.expenses; t.nasiriya.netSales += day.nasiriya.netSales
      
      t.totalSales += day.totalSales; t.totalPurch += day.totalPurch
    })
    return t
  }

  const totals = calculateTotals()

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '10px', fontFamily: 'Arial', direction: 'rtl', overflowX: 'auto' }}>
      
      <h1 style={{ color: '#1e3a8a', fontSize: '24px', marginBottom: '20px', textAlign: 'center' }}>{T.title}</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: 'white' }}>
            <th rowSpan={2} style={thStyle}>{T.day}</th>
            <th rowSpan={2} style={thStyle}>{T.date}</th>
            <th rowSpan={2} style={{...thStyle, background: '#ca8a04'}}>{T.totalSales}</th>
            <th rowSpan={2} style={{...thStyle, background: '#ca8a04'}}>{T.totalPurch}</th>
            
            <th colSpan={6} style={{...thStyle, background: '#1e3a8a'}}>{T.dakhil}</th>
            <th colSpan={6} style={{...thStyle, background: '#1e3a8a'}}>{T.nasiriya}</th>
          </tr>
          <tr style={{ background: '#1e40af', color: 'white' }}>
            <th style={thStyle}>{T.fruit}</th><th style={thStyle}>{T.veg}</th><th style={thStyle}>{T.paper}</th>
            <th style={thStyle}>{T.sales}</th><th style={thStyle}>{T.expenses}</th><th style={thStyle}>{T.netSales}</th>
            
            <th style={thStyle}>{T.fruit}</th><th style={thStyle}>{T.veg}</th><th style={thStyle}>{T.paper}</th>
            <th style={thStyle}>{T.sales}</th><th style={thStyle}>{T.expenses}</th><th style={thStyle}>{T.netSales}</th>
          </tr>
        </thead>
        <tbody>
          {reportData.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
              <td style={{...tdStyle, fontWeight: 'bold'}}>{T.days[i]}</td>
              <td style={tdStyle}>{row.date}</td>
              <td style={{...tdStyle, fontWeight: 'bold', color: '#059669'}}>{row.totalSales.toFixed(2)}</td>
              <td style={{...tdStyle, fontWeight: 'bold', color: '#dc2626'}}>{row.totalPurch.toFixed(2)}</td>
              
              <td style={tdStyle}>{row.dakhil.fruit > 0 ? row.dakhil.fruit.toFixed(2) : '-'}</td>
              <td style={tdStyle}>{row.dakhil.veg > 0 ? row.dakhil.veg.toFixed(2) : '-'}</td>
              <td style={tdStyle}>{row.dakhil.paper > 0 ? row.dakhil.paper.toFixed(2) : '-'}</td>
              <td style={tdStyle}>{row.dakhil.sales.toFixed(2)}</td>
              <td style={tdStyle}>{row.dakhil.expenses.toFixed(2)}</td>
              <td style={{...tdStyle, background: '#dcfce7', fontWeight: 'bold', color: '#065f46'}}>{row.dakhil.netSales.toFixed(2)}</td>
              
              <td style={tdStyle}>{row.nasiriya.fruit > 0 ? row.nasiriya.fruit.toFixed(2) : '-'}</td>
              <td style={tdStyle}>{row.nasiriya.veg > 0 ? row.nasiriya.veg.toFixed(2) : '-'}</td>
              <td style={tdStyle}>{row.nasiriya.paper > 0 ? row.nasiriya.paper.toFixed(2) : '-'}</td>
              <td style={tdStyle}>{row.nasiriya.sales.toFixed(2)}</td>
              <td style={tdStyle}>{row.nasiriya.expenses.toFixed(2)}</td>
              <td style={{...tdStyle, background: '#dcfce7', fontWeight: 'bold', color: '#065f46'}}>{row.nasiriya.netSales.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#fef08a', fontWeight: 'bold', color: '#000' }}>
            <td colSpan={2} style={tdStyle}>{T.totalRow}</td>
            <td style={tdStyle}>{totals.totalSales.toFixed(2)}</td>
            <td style={tdStyle}>{totals.totalPurch.toFixed(2)}</td>
            
            <td style={tdStyle}>{totals.dakhil.fruit.toFixed(2)}</td>
            <td style={tdStyle}>{totals.dakhil.veg.toFixed(2)}</td>
            <td style={tdStyle}>{totals.dakhil.paper.toFixed(2)}</td>
            <td style={tdStyle}>{totals.dakhil.sales.toFixed(2)}</td>
            <td style={tdStyle}>{totals.dakhil.expenses.toFixed(2)}</td>
            <td style={tdStyle}>{totals.dakhil.netSales.toFixed(2)}</td>
            
            <td style={tdStyle}>{totals.nasiriya.fruit.toFixed(2)}</td>
            <td style={tdStyle}>{totals.nasiriya.veg.toFixed(2)}</td>
            <td style={tdStyle}>{totals.nasiriya.paper.toFixed(2)}</td>
            <td style={tdStyle}>{totals.nasiriya.sales.toFixed(2)}</td>
            <td style={tdStyle}>{totals.nasiriya.expenses.toFixed(2)}</td>
            <td style={tdStyle}>{totals.nasiriya.netSales.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default function WeeklyReportPage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <WeeklyReportContent />
    </Suspense>
  )
}

const thStyle: React.CSSProperties = { padding: '8px', border: '1px solid #1e40af', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '8px', border: '1px solid #e5e7eb' }