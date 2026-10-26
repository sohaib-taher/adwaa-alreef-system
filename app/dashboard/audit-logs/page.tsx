'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  title: 'سجل التعديلات والعمليات (Audit Log)',
  subTitle: 'مراقبة كل التعديلات والحذف التي تتم على النظام',
  date: 'التاريخ والوقت',
  user: 'المستخدم',
  action: 'الإجراء',
  details: 'التفاصيل',
  oldValue: 'القيمة القديمة',
  newValue: 'القيمة الجديدة',
  noData: 'لا توجد عمليات مسجلة',
  loading: 'جاري التحميل...',
  debit: 'مديونية',
  credit: 'سداد'
}

function AuditLogsContent() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase.from('users').select('company_id').eq('auth_id', user.id).single()
      if (!userData) return

      const { data } = await supabase
        .from('audit_logs')
        .select(`
          id, action, table_name, created_at, old_values, new_values,
          users ( full_name )
        `)
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false })
        .limit(100)

      setLogs(data || [])
      setLoading(false)
    }
    loadData()
  }, [])

  // دالة تحويل بيانات JSON إلى كلام بشري مفهوم
  const renderDetails = (data: any) => {
    if (!data) return <span style={{ color: '#9ca3af' }}>-</span>

    const items = []

    if (data.party_name) items.push(`الشخص: ${data.party_name}`)
    if (data.amount !== undefined) items.push(`المبلغ: ${data.amount}`)
    if (data.type) items.push(`النوع: ${data.type === 'debit' ? T.debit : T.credit}`)
    if (data.description) items.push(`البيان: ${data.description}`)
    
    if (data.network_amount !== undefined) items.push(`الشبكة: ${data.network_amount}`)
    if (data.cash_amount !== undefined) items.push(`الكاش: ${data.cash_amount}`)
    if (data.expenses !== undefined) items.push(`المصروفات: ${data.expenses}`)
    if (data.invoices !== undefined) items.push(`الفواتير: ${data.invoices}`)
    if (data.total_sales !== undefined) items.push(`الصافي: ${data.total_sales}`)

    if (data.debt_date) items.push(`التاريخ: ${data.debt_date}`)
    if (data.revenue_date) items.push(`التاريخ: ${data.revenue_date}`)

    if (items.length === 0) return <span style={{ color: '#9ca3af' }}>تفاصيل أخرى</span>

    return (
      <ul style={{ margin: 0, padding: '0 15px', listStyleType: 'disc', fontSize: '12px', color: '#374151', textAlign: 'right' }}>
        {items.map((item, idx) => <li key={idx} style={{ marginBottom: '3px' }}>{item}</li>)}
      </ul>
    )
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', overflowX: 'auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '24px' }}>{T.title}</h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>{T.subTitle}</p>
      </div>

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '10px', color: '#6b7280' }}>
          {T.noData}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '10px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#1e3a8a', color: 'white' }}>
                <th style={thStyle}>{T.date}</th>
                <th style={thStyle}>{T.user}</th>
                <th style={thStyle}>{T.action}</th>
                <th style={thStyle}>{T.oldValue}</th>
                <th style={thStyle}>{T.newValue}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const dateObj = new Date(log.created_at)
                const formattedDate = `${dateObj.toLocaleDateString('ar-EG')} - ${dateObj.toLocaleTimeString('ar-EG')}`
                const userName = (log.users as any)?.full_name || 'غير معروف'

                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{...tdStyle, whiteSpace: 'nowrap'}}>{formattedDate}</td>
                    <td style={{...tdStyle, fontWeight: 'bold', color: '#065f46'}}>{userName}</td>
                    <td style={{...tdStyle, color: log.action.includes('حذف') ? '#dc2626' : log.action.includes('تعديل') ? '#f59e0b' : '#2563eb', fontWeight: 'bold', whiteSpace: 'nowrap'}}>
                      {log.action}
                    </td>
                    <td style={tdStyle}>{renderDetails(log.old_values)}</td>
                    <td style={tdStyle}>{renderDetails(log.new_values)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function AuditLogsPage() {
  return <Suspense fallback={<div>جاري التحميل...</div>}><AuditLogsContent /></Suspense>
}

const thStyle: React.CSSProperties = { padding: '12px', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '12px', textAlign: 'center', verticalAlign: 'top' }