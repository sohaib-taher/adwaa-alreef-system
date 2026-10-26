'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'

const T = {
  title: 'تأكيد الاستلام',
  print: '🖨️ طباعة الكشف',
  export: '📥 تصدير Excel',
  note: 'استلمتم عدداً غير المكتوب؟ اكتبوا العدد الحقيقي وسبب الفرق أو ما بقي — يصل للإدارة، ولا يتغير الكشف حتى تعتمده.',
  date: 'اليوم',
  branch: 'الفرع',
  item: 'الصنف',
  sent: 'المُرسل',
  received: 'المستلم فعلاً ✎',
  diff: 'الفرق أو المتبقي',
  action: 'إرسال',
  success: 'تم الإرسال للإدارة بنجاح',
  noData: 'لا توجد استلامات بانتظار التأكيد',
  footer: 'فواتير المبيعات تُصدر بقدر ما اعتُمد من دفعاتكم — فاتورةَ يومٍ أو أسبوع',
  loading: 'جاري التحميل...'
}

function WorkerConfirmContent() {
  const [loading, setLoading] = useState(true)
  const [allocations, setAllocations] = useState<any[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)

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
      .from('receipt_branch_allocations')
      .select(`
        id, sent_qty, actual_received_qty, discrepancy_note, worker_status,
        branches ( name ),
        daily_receipt_items (
          manual_product_name,
          manual_unit,
          daily_receipts ( receipt_date, company_id )
        )
      `)
      .eq('worker_status', 'pending')
      .order('created_at', { ascending: false })

    const filtered = (data || []).filter((a: any) => 
      a.daily_receipt_items?.daily_receipts?.company_id === userData.company_id
    )
    setAllocations(filtered)
    setLoading(false)
  }

  const handleInputChange = (id: string, field: string, value: any) => {
    setAllocations(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  async function handleSend(id: string) {
    const allocation = allocations.find(a => a.id === id)
    if (!allocation || allocation.actual_received_qty === null || allocation.actual_received_qty === '') {
      alert('الرجاء إدخال الكمية المستلمة')
      return
    }

    setSavingId(id)
    const supabase = createClient()

    const { error } = await supabase
      .from('receipt_branch_allocations')
      .update({
        actual_received_qty: Number(allocation.actual_received_qty),
        discrepancy_note: allocation.discrepancy_note,
        worker_status: 'pending_approval'
      })
      .eq('id', id)

    if (!error) {
      setAllocations(prev => prev.filter(a => a.id !== id))
      alert(T.success)
    } else {
      alert('خطأ: ' + error.message)
    }
    setSavingId(null)
  }

  const handleExport = () => {
    const excelData = allocations.map(row => {
      const item = row.daily_receipt_items
      const dateObj = new Date(item?.daily_receipts?.receipt_date)
      const formattedDate = `${dateObj.getDate()}-${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`
      return {
        'التاريخ': formattedDate,
        'الفرع': row.branches?.name,
        'الصنف': item?.manual_product_name,
        'المُرسل': row.sent_qty,
        'المستلم': row.actual_received_qty || '',
        'الملاحظات': row.discrepancy_note || ''
      }
    })
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "كشف الاستلام")
    XLSX.writeFile(wb, `كشف_استلام_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', maxWidth: '900px', margin: '0 auto' }}>
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#065f46', fontSize: '26px', margin: 0, fontWeight: 'bold' }}>{T.title}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} style={btnStyle('#059669')}>{T.print}</button>
          <button onClick={handleExport} style={btnStyle('#2563eb')}>{T.export}</button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
          {T.note}
        </p>
      </div>

      {allocations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '10px', color: '#6b7280', border: '1px solid #e5e7eb' }}>
          {T.noData}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '10px', overflowX: 'auto', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={thStyle}>{T.date}</th>
                <th style={thStyle}>{T.branch}</th>
                <th style={thStyle}>{T.item}</th>
                <th style={thStyle}>{T.sent}</th>
                <th style={thStyle}>{T.received}</th>
                <th style={thStyle}>{T.diff}</th>
                <th className="no-print" style={thStyle}>{T.action}</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((row) => {
                const item = row.daily_receipt_items
                const unitText = item?.manual_unit ? ` ${item.manual_unit}` : ''
                const dateObj = new Date(item?.daily_receipts?.receipt_date)
                const formattedDate = `${dateObj.getDate()}-${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`

                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>{formattedDate}</td>
                    <td style={tdStyle}>{row.branches?.name}</td>
                    <td style={{...tdStyle, fontWeight: 'bold'}}>{item?.manual_product_name}</td>
                    <td style={{...tdStyle, color: '#374151'}}>{row.sent_qty} {unitText}</td>
                    <td style={tdStyle}>
                      <input type="number" placeholder="العدد" value={row.actual_received_qty || ''} onChange={(e) => handleInputChange(row.id, 'actual_received_qty', e.target.value)} style={inputStyle} />
                    </td>
                    <td style={tdStyle}>
                      <input type="text" placeholder="السبب..." value={row.discrepancy_note || ''} onChange={(e) => handleInputChange(row.id, 'discrepancy_note', e.target.value)} style={inputStyle} />
                    </td>
                    <td className="no-print" style={tdStyle}>
                      <button onClick={() => handleSend(row.id)} disabled={savingId === row.id} style={{ padding: '8px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                        {savingId === row.id ? '...' : T.action}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: '30px' }}>
        {T.footer}
      </p>

      <style jsx global>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          body { background: white !important; }
          input { border: none !important; background: transparent !important; text-align: right !important; }
          table { font-size: 12px !important; }
        }
      `}</style>
    </div>
  )
}

export default function WorkerConfirmPage() {
  return <Suspense fallback={<div>جاري التحميل...</div>}><WorkerConfirmContent /></Suspense>
}

const thStyle: React.CSSProperties = { padding: '15px', fontSize: '14px', fontWeight: 'bold', color: '#374151' }
const tdStyle: React.CSSProperties = { padding: '15px', fontSize: '14px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', textAlign: 'center', boxSizing: 'border-box' }
const btnStyle = (bg: string): React.CSSProperties => ({ padding: '10px 20px', background: bg, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' })