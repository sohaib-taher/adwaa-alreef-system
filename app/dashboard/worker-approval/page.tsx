'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  title: 'اعتماد استلامات العمال',
  subTitle: 'مراجعة الفروقات والموافقة عليها',
  date: 'التاريخ',
  branch: 'الفرع',
  item: 'الصنف',
  sent: 'المُرسل',
  received: 'المستلم',
  diff: 'الفرق',
  note: 'ملاحظات العامل',
  action: 'الإجراء',
  approve: 'اعتماد',
  reject: 'رفض',
  noData: 'لا توجد فروقات بانتظار الاعتماد',
  loading: 'جاري التحميل...'
}

function WorkerApprovalContent() {
  const [loading, setLoading] = useState(true)
  const [approvals, setApprovals] = useState<any[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

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
      .eq('worker_status', 'pending_approval')
      .order('created_at', { ascending: false })

    const filtered = (data || []).filter((a: any) => 
      a.daily_receipt_items?.daily_receipts?.company_id === userData.company_id
    )

    setApprovals(filtered)
    setLoading(false)
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setProcessingId(id)
    const supabase = createClient()
    const newStatus = action === 'approve' ? 'admin_approved' : 'admin_rejected'

    const { error } = await supabase
      .from('receipt_branch_allocations')
      .update({ worker_status: newStatus })
      .eq('id', id)

    if (!error) {
      setApprovals(prev => prev.filter(a => a.id !== id))
    } else {
      alert('حدث خطأ: ' + error.message)
    }
    setProcessingId(null)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#065f46', fontSize: '26px', margin: '0 0 10px' }}>{T.title}</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>{T.subTitle}</p>
      </div>

      {approvals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '10px', color: '#6b7280', fontWeight: 'bold' }}>
          {T.noData}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '10px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead style={{ background: '#065f46', color: 'white' }}>
              <tr>
                <th style={thStyle}>{T.date}</th>
                <th style={thStyle}>{T.branch}</th>
                <th style={thStyle}>{T.item}</th>
                <th style={thStyle}>{T.sent}</th>
                <th style={thStyle}>{T.received}</th>
                <th style={thStyle}>{T.diff}</th>
                <th style={thStyle}>{T.note}</th>
                <th style={thStyle}>{T.action}</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((row) => {
                const item = row.daily_receipt_items
                const unitText = item?.manual_unit ? ` ${item.manual_unit}` : ''
                const dateObj = new Date(item?.daily_receipts?.receipt_date)
                const formattedDate = `${dateObj.getDate()}-${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`
                const diff = Number(row.sent_qty) - Number(row.actual_received_qty)

                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>{formattedDate}</td>
                    <td style={tdStyle}>{row.branches?.name}</td>
                    <td style={{...tdStyle, fontWeight: 'bold'}}>{item?.manual_product_name}</td>
                    <td style={tdStyle}>{row.sent_qty} {unitText}</td>
                    <td style={{...tdStyle, color: '#3b82f6', fontWeight: 'bold'}}>{row.actual_received_qty} {unitText}</td>
                    <td style={{...tdStyle, color: diff !== 0 ? '#dc2626' : '#059669', fontWeight: 'bold'}}>
                      {diff !== 0 ? diff : 'مطابق'}
                    </td>
                    <td style={{...tdStyle, color: '#6b7280'}}>{row.discrepancy_note || '-'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => handleAction(row.id, 'approve')} disabled={processingId === row.id} style={{ padding: '6px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          {T.approve}
                        </button>
                        <button onClick={() => handleAction(row.id, 'reject')} disabled={processingId === row.id} style={{ padding: '6px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          {T.reject}
                        </button>
                      </div>
                    </td>
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

export default function WorkerApprovalPage() {
  return <Suspense fallback={<div>جاري التحميل...</div>}><WorkerApprovalContent /></Suspense>
}

const thStyle: React.CSSProperties = { padding: '12px', fontSize: '13px', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: '14px' }