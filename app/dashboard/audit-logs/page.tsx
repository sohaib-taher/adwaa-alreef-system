'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'

const T = {
  title: 'سجل التعديلات والعمليات (Audit Log)',
  subTitle: 'مراقبة كل التعديلات والحذف التي تتم على النظام',
  print: '🖨️ طباعة',
  export: '📥 تصدير Excel',
  deleteSelected: '🗑️ حذف المحدد',
  date: 'التاريخ والوقت',
  user: 'المستخدم',
  action: 'الإجراء',
  details: 'التفاصيل',
  oldValue: 'القيمة القديمة',
  newValue: 'القيمة الجديدة',
  noData: 'لا توجد عمليات مسجلة',
  loading: 'جاري التحميل...',
  debit: 'مديونية',
  credit: 'سداد',
  selectAll: 'تحديد الكل',
  confirmDelete: 'هل أنت متأكد من حذف السجلات المحددة نهائياً؟ (يُفضل تصديرها إلى Excel كنسخة احتياطية أولاً).'
}

function AuditLogsContent() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])
  const [selectedLogs, setSelectedLogs] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

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
      .limit(200) // عرض آخر 200 سجل

    setLogs(data || [])
    setLoading(false)
  }

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

  // دالة تحويل الـ JSON إلى نص لتصديره في الإكسل
  const jsonToText = (data: any) => {
    if (!data) return '-'
    const items = []
    if (data.party_name) items.push(`الشخص: ${data.party_name}`)
    if (data.amount !== undefined) items.push(`المبلغ: ${data.amount}`)
    if (data.network_amount !== undefined) items.push(`الشبكة: ${data.network_amount}`)
    if (data.cash_amount !== undefined) items.push(`الكاش: ${data.cash_amount}`)
    if (data.total_sales !== undefined) items.push(`الصافي: ${data.total_sales}`)
    return items.join(' | ') || JSON.stringify(data)
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedLogs(logs.map(log => log.id))
    else setSelectedLogs([])
  }

  const handleSelectLog = (id: string) => {
    setSelectedLogs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleDeleteSelected() {
    if (selectedLogs.length === 0) return
    if (!window.confirm(T.confirmDelete)) return

    const supabase = createClient()
    const { error } = await supabase.from('audit_logs').delete().in('id', selectedLogs)
    
    if (error) { alert('خطأ: ' + error.message); return }
    
    setSelectedLogs([])
    await loadData()
  }

  async function handleDeleteSingle(id: string) {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return
    const supabase = createClient()
    const { error } = await supabase.from('audit_logs').delete().eq('id', id)
    if (error) { alert('خطأ: ' + error.message); return }
    await loadData()
  }

  const handleExport = () => {
    const excelData = logs.map(log => {
      const dateObj = new Date(log.created_at)
      return {
        'التاريخ والوقت': `${dateObj.toLocaleDateString('ar-EG')} - ${dateObj.toLocaleTimeString('ar-EG')}`,
        'المستخدم': (log.users as any)?.full_name || 'غير معروف',
        'الإجراء': log.action,
        'القيمة القديمة': jsonToText(log.old_values),
        'القيمة الجديدة': jsonToText(log.new_values)
      }
    })
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "سجل التعديلات")
    XLSX.writeFile(wb, `سجل_التعديلات_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', overflowX: 'auto' }}>
      
      {/* الشريط العلوي */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#065f46', fontSize: '24px' }}>{T.title}</h1>
          <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>{T.subTitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedLogs.length > 0 && (
            <button onClick={handleDeleteSelected} style={btnStyle('#dc2626')}>{T.deleteSelected} ({selectedLogs.length})</button>
          )}
          <button onClick={() => window.print()} style={btnStyle('#059669')}>{T.print}</button>
          <button onClick={handleExport} style={btnStyle('#2563eb')}>{T.export}</button>
        </div>
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
                <th className="no-print" style={{...thStyle, width: '40px'}}>
                  <input type="checkbox" onChange={handleSelectAll} checked={selectedLogs.length === logs.length && logs.length > 0} style={{ width: '18px', height: '18px' }} />
                </th>
                <th style={thStyle}>{T.date}</th>
                <th style={thStyle}>{T.user}</th>
                <th style={thStyle}>{T.action}</th>
                <th style={thStyle}>{T.oldValue}</th>
                <th style={thStyle}>{T.newValue}</th>
                <th className="no-print" style={thStyle}>حذف</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const dateObj = new Date(log.created_at)
                const formattedDate = `${dateObj.toLocaleDateString('ar-EG')} - ${dateObj.toLocaleTimeString('ar-EG')}`
                const userName = (log.users as any)?.full_name || 'غير معروف'
                const isSelected = selectedLogs.includes(log.id)

                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb', background: isSelected ? '#eff6ff' : 'transparent' }}>
                    <td className="no-print" style={tdStyle}>
                      <input type="checkbox" checked={isSelected} onChange={() => handleSelectLog(log.id)} style={{ width: '18px', height: '18px' }} />
                    </td>
                    <td style={{...tdStyle, whiteSpace: 'nowrap'}}>{formattedDate}</td>
                    <td style={{...tdStyle, fontWeight: 'bold', color: '#065f46'}}>{userName}</td>
                    <td style={{...tdStyle, color: log.action.includes('حذف') ? '#dc2626' : log.action.includes('تعديل') ? '#f59e0b' : '#2563eb', fontWeight: 'bold', whiteSpace: 'nowrap'}}>
                      {log.action}
                    </td>
                    <td style={tdStyle}>{renderDetails(log.old_values)}</td>
                    <td style={tdStyle}>{renderDetails(log.new_values)}</td>
                    <td className="no-print" style={tdStyle}>
                      <button onClick={() => handleDeleteSingle(log.id)} style={{ padding: '5px 10px', background: '#fecaca', color: '#991b1b', border: '1px solid #f87171', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                        حذف
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* تنسيقات الطباعة */}
      <style jsx global>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          body { background: white !important; }
          table { font-size: 11px !important; }
          td { border: 1px solid #ccc !important; }
        }
      `}</style>
    </div>
  )
}

export default function AuditLogsPage() {
  return <Suspense fallback={<div>جاري التحميل...</div>}><AuditLogsContent /></Suspense>
}

const thStyle: React.CSSProperties = { padding: '12px', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '12px', textAlign: 'center', verticalAlign: 'top' }
const btnStyle = (bg: string): React.CSSProperties => ({ padding: '10px 20px', background: bg, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' })