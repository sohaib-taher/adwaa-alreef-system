'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

const T = {
  title: '\u062A\u0623\u0643\u064A\u062F \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0639\u0645\u0627\u0644',
  date: '\u0627\u0644\u064A\u0648\u0645',
  branch: '\u0627\u0644\u0641\u0631\u0639',
  item: '\u0627\u0644\u0635\u0646\u0641',
  sent: '\u0627\u0644\u0645\u064F\u0631\u0633\u0644',
  received: '\u0627\u0644\u0645\u0633\u062A\u0644\u0645 \u0641\u0639\u0644\u0627\u064B \u270E',
  diff: '\u0627\u0644\u0641\u0631\u0642 \u0623\u0648 \u0627\u0644\u0645\u062A\u0628\u0642\u064A',
  action: '\u0627\u0644\u0625\u062C\u0631\u0627\u0621',
  send: '\u0625\u0631\u0633\u0627\u0644',
  sentSuccess: '\u062A\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0644\u0644\u0625\u062F\u0627\u0631\u0629 \u0628\u0646\u062C\u0627\u062D',
  noData: '\u0644\u0627 \u062A\u0648\u062C\u062F \u0627\u0633\u062A\u0644\u0627\u0645\u0627\u062A \u064A\u0648\u0645 \u0627\u0644\u064A\u0648\u0645',
  footerNote: '\u0641\u0648\u0627\u062A\u064A\u0631 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u062A\u064F\u0635\u062F\u0631 \u0628\u0642\u062F\u0631 \u0645\u0627 \u0627\u0639\u062A\u0645\u062F \u0645\u0646 \u062F\u0641\u0639\u0627\u062A\u0643\u0645 \u2014 \u0641\u0627\u062A\u0648\u0631\u0629\u064E \u064A\u0648\u0645\u0650 \u0623\u0648 \u0623\u0633\u0628\u0648\u0639',
}

function WorkerConfirmContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [allocations, setAllocations] = useState<any[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)

  // جلب الاستلامات التي تحتاج تأكيد
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      // جلب بيانات المستخدم لمعرفة شركته
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: userData } = await supabase.from('users').select('company_id').eq('auth_id', user.id).single()
      if (!userData) return

      // جلب التوزيعات التي لم يتم تأكيدها بعد (worker_status = 'pending')
      const { data } = await supabase
        .from('receipt_branch_allocations')
        .select(`
          id,
          sent_qty,
          actual_received_qty,
          discrepancy_note,
          worker_status,
          branches ( name ),
          daily_receipt_items (
            unit_price,
            daily_receipts ( receipt_date, company_id ),
            manual_product_name, manual_unit
          )
        `)
        .eq('worker_status', 'pending')
        .order('created_at', { ascending: false })

      // فلترة البيانات للتأكد من أنها تخص شركة المستخدم
      const filtered = (data || []).filter((a: any) => 
        a.daily_receipt_items?.daily_receipts?.company_id === userData.company_id
      )

      setAllocations(filtered)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleInputChange = (id: string, field: string, value: any) => {
    setAllocations(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  async function handleSend(id: string) {
    const allocation = allocations.find(a => a.id === id)
    if (!allocation) return

    // التحقق من إدخال الكمية
    if (allocation.actual_received_qty === null || allocation.actual_received_qty === '') {
      alert('الرجاء إدخال الكمية المستلمة فعلياً')
      return
    }

    setSavingId(id)
    const supabase = createClient()

    const { error } = await supabase
      .from('receipt_branch_allocations')
      .update({
        actual_received_qty: Number(allocation.actual_received_qty),
        discrepancy_note: allocation.discrepancy_note,
        worker_status: 'pending_approval' // تغيير الحالة ليراها المدير
      })
      .eq('id', id)

    if (!error) {
      // إزالة السطر من الشاشة بعد الإرسال بنجاح
      setAllocations(prev => prev.filter(a => a.id !== id))
      alert(T.sentSuccess)
    } else {
      alert('حدث خطأ: ' + error.message)
    }
    
    setSavingId(null)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>جاري التحميل...</div>

  return (
    <div style={{ padding: '15px', fontFamily: 'Arial', direction: 'rtl', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* الترويسة */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#065f46', fontSize: '24px', margin: '0 0 10px' }}>{T.title}</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
          استلمتم عدداً غير المكتوب؟ اكتبوا العدد الحقيقي وسبب الفرق أو ما بقي — يصل للإدارة، ولا يتغير الكشف حتى تعتمده.
        </p>
      </div>

      {/* الجدول */}
      {allocations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '10px', color: '#6b7280' }}>
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
                <th style={thStyle}>{T.action}</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((row) => {
                const productName = row.daily_receipt_items?.manual_product_name || 'غير محدد'
                const unitText = row.daily_receipt_items?.manual_unit ? ` ${row.daily_receipt_items.manual_unit}` : ''
                const dateObj = new Date(row.daily_receipt_items?.daily_receipts?.receipt_date)
                const formattedDate = `${dateObj.getDate()}-${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`

                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>{formattedDate}</td>
                    <td style={tdStyle}>{row.branches?.name}</td>
                    <td style={{...tdStyle, fontWeight: 'bold'}}>{productName}</td>
                    <td style={{...tdStyle, color: '#059669', fontWeight: 'bold'}}>
                      {row.sent_qty} {unitText}
                    </td>
                    <td style={tdStyle}>
                      <input 
                        type="number" 
                        placeholder="الكمية" 
                        value={row.actual_received_qty || ''} 
                        onChange={(e) => handleInputChange(row.id, 'actual_received_qty', e.target.value)}
                        style={{...inputStyle, border: '2px solid #3b82f6'}} 
                      />
                    </td>
                    <td style={tdStyle}>
                      <input 
                        type="text" 
                        placeholder="سبب الفرق..." 
                        value={row.discrepancy_note || ''} 
                        onChange={(e) => handleInputChange(row.id, 'discrepancy_note', e.target.value)}
                        style={inputStyle} 
                      />
                    </td>
                    <td style={tdStyle}>
                      <button 
                        onClick={() => handleSend(row.id)}
                        disabled={savingId === row.id}
                        style={{ padding: '8px 15px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        {savingId === row.id ? '...' : T.send}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', marginTop: '20px', fontWeight: 'bold' }}>
        {T.footerNote}
      </p>
    </div>
  )
}

export default function WorkerConfirmPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>...</div>}>
      <WorkerConfirmContent />
    </Suspense>
  )
}

const thStyle: React.CSSProperties = { padding: '12px', fontSize: '13px', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '10px', fontSize: '14px' }
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px',
  textAlign: 'center', fontSize: '14px', boxSizing: 'border-box'
}