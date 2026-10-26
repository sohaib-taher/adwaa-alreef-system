'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

const T = {
  titleVeg: '\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u062E\u0636\u0627\u0631 \u0627\u0644\u064A\u0648\u0645\u064A',
  titleFruit: '\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0641\u0648\u0627\u0643\u0647 \u0627\u0644\u064A\u0648\u0645\u064A',
  titlePaper: '\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0648\u0631\u0642\u064A\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A',
  item: '\u0627\u0644\u0635\u0646\u0641',
  supplier: '\u0627\u0644\u0645\u0648\u0631\u062F',
  unit: '\u0627\u0644\u0639\u0628\u0648\u0629',
  totalQty: '\u0627\u0644\u0643\u0645\u064A\u0629 \u0627\u0644\u0643\u0644\u064A\u0629',
  price: '\u0627\u0644\u0633\u0639\u0631',
  total: '\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A',
  brDakhil: '\u0627\u0644\u062F\u062E\u0644',
  brNasiriya: '\u0627\u0644\u0646\u0627\u0635\u0631\u064A\u0629',
  brTaj: '\u0627\u0644\u062A\u0627\u062C',
  taxToggle: '\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0636\u0631\u064A\u0628\u0629 (15%)',
  save: '\u062D\u0641\u0638 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645',
  addRow: '+ \u0625\u0636\u0627\u0641\u0629 \u0635\u0646\u0641',
  success: '\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0628\u0646\u062C\u0627\u062D!',
  error: '\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062D\u0641\u0638',
}

function DailyReceiptsContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'vegetable'

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [isTaxEnabled, setIsTaxEnabled] = useState(type === 'fruit')
  
  // تخزين معرفات الفروع
  const [dakhilId, setDakhilId] = useState('')
  const [nasiriyaId, setNasiriyaId] = useState('')
  const [tajId, setTajId] = useState('')

  // الصفوف الافتراضية (بدون قوائم منسدلة)
  const [rows, setRows] = useState<any[]>([
    { product_name: '', supplier_name: '', unit: '', total_qty: 0, price: 0, dakhil: 0, nasiriya: 0, taj: 0 }
  ])

  useState(() => {
    // جلب معرفات الفروع مرة واحدة عند فتح الشاشة
    const supabase = createClient()
    supabase.from('branches').select('id, name').eq('is_active', true).then(({ data }) => {
      if (data) {
        setDakhilId(data.find(b => b.name.includes('الدخل'))?.id || '')
        setNasiriyaId(data.find(b => b.name.includes('الناصرية'))?.id || '')
        setTajId(data.find(b => b.name.includes('التاج') || b.name.includes('تاج'))?.id || '')
      }
    })
  })

  const handleRowChange = (index: number, field: string, value: any) => {
    const newRows = [...rows]
    newRows[index][field] = value
    setRows(newRows)
  }

  const addRow = () => {
    setRows([...rows, { product_name: '', supplier_name: '', unit: '', total_qty: 0, price: 0, dakhil: 0, nasiriya: 0, taj: 0 }])
  }

  const getTitle = () => {
    if (type === 'fruit') return T.titleFruit
    if (type === 'paper') return T.titlePaper
    return T.titleVeg
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')
      
      const { data: userData } = await supabase.from('users').select('company_id').eq('auth_id', user.id).single()
      if (!userData) throw new Error('Company not found')

      // 1. إنشاء سند الاستلام
      const { data: receipt, error: receiptError } = await supabase.from('daily_receipts').insert({
        company_id: userData.company_id,
        receipt_date: date,
        category_type: type,
        is_tax_enabled: isTaxEnabled,
      }).select('id').single()

      if (receiptError) throw receiptError

      // 2. حفظ الأصناف
      for (const row of rows) {
        if (!row.product_name) continue; // تخطي السطور الفارغة

        const { data: item, error: itemError } = await supabase.from('daily_receipt_items').insert({
          receipt_id: receipt.id,
          manual_product_name: row.product_name,
          manual_supplier_name: row.supplier_name,
          manual_unit: row.unit,
          total_qty: row.total_qty || 0,
          unit_price: row.price || 0
        }).select('id').single()

        if (itemError) throw itemError

        // 3. توزيع الفروع
        if (row.dakhil > 0 && dakhilId) {
          await supabase.from('receipt_branch_allocations').insert({ receipt_item_id: item.id, branch_id: dakhilId, sent_qty: row.dakhil })
        }
        if (row.nasiriya > 0 && nasiriyaId) {
          await supabase.from('receipt_branch_allocations').insert({ receipt_item_id: item.id, branch_id: nasiriyaId, sent_qty: row.nasiriya })
        }
        if (row.taj > 0 && tajId) {
          await supabase.from('receipt_branch_allocations').insert({ receipt_item_id: item.id, branch_id: tajId, sent_qty: row.taj })
        }
      }

      setMessage(T.success)
      setRows([{ product_name: '', supplier_name: '', unit: '', total_qty: 0, price: 0, dakhil: 0, nasiriya: 0, taj: 0 }])
      
    } catch (err: any) {
      setMessage(T.error + ': ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '24px' }}>{getTitle()}</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {type === 'fruit' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#f3f4f6', padding: '8px 15px', borderRadius: '8px' }}>
              <input type="checkbox" checked={isTaxEnabled} onChange={(e) => setIsTaxEnabled(e.target.checked)} style={{ width: '20px', height: '20px' }} />
              <span style={{ fontWeight: 'bold', color: '#374151' }}>{T.taxToggle}</span>
            </label>
          )}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
        </div>
      </div>

      {message && (
        <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '8px', background: message.includes('بنجاح') ? '#d1fae5' : '#fee2e2', color: message.includes('بنجاح') ? '#065f46' : '#991b1b', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '10px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead style={{ background: '#065f46', color: 'white' }}>
            <tr>
              <th style={thStyle}>{T.item}</th>
              <th style={thStyle}>{T.supplier}</th>
              <th style={thStyle}>{T.unit}</th>
              <th style={thStyle}>{T.totalQty}</th>
              <th style={thStyle}>{T.price}</th>
              <th style={thStyle}>{T.total}</th>
              <th style={thStyle}>{T.brDakhil}</th>
              <th style={thStyle}>{T.brNasiriya}</th>
              <th style={thStyle}>{T.brTaj}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const total = row.total_qty * row.price;
              return (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}><input type="text" placeholder="اسم الصنف" value={row.product_name} onChange={(e) => handleRowChange(index, 'product_name', e.target.value)} style={inputStyle} /></td>
                  <td style={tdStyle}><input type="text" placeholder="اسم المورد" value={row.supplier_name} onChange={(e) => handleRowChange(index, 'supplier_name', e.target.value)} style={inputStyle} /></td>
                  <td style={tdStyle}><input type="text" placeholder="كرتون..." value={row.unit} onChange={(e) => handleRowChange(index, 'unit', e.target.value)} style={inputStyle} /></td>
                  <td style={tdStyle}><input type="number" value={row.total_qty || ''} onChange={(e) => handleRowChange(index, 'total_qty', Number(e.target.value))} style={inputStyle} /></td>
                  <td style={tdStyle}><input type="number" value={row.price || ''} onChange={(e) => handleRowChange(index, 'price', Number(e.target.value))} style={inputStyle} /></td>
                  <td style={{...tdStyle, fontWeight: 'bold', color: '#065f46'}}>{total.toFixed(2)}</td>
                  <td style={tdStyle}><input type="number" value={row.dakhil || ''} onChange={(e) => handleRowChange(index, 'dakhil', Number(e.target.value))} style={{...inputStyle, background: '#f0fdf4'}} /></td>
                  <td style={tdStyle}><input type="number" value={row.nasiriya || ''} onChange={(e) => handleRowChange(index, 'nasiriya', Number(e.target.value))} style={{...inputStyle, background: '#f0fdf4'}} /></td>
                  <td style={tdStyle}><input type="number" value={row.taj || ''} onChange={(e) => handleRowChange(index, 'taj', Number(e.target.value))} style={{...inputStyle, background: '#f0fdf4'}} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
        <button onClick={addRow} style={{ padding: '12px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit' }}>
          {T.addRow}
        </button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '12px 30px', background: saving ? '#9ca3af' : '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontFamily: 'inherit' }}>
          {saving ? 'جاري الحفظ...' : T.save}
        </button>
      </div>
    </div>
  )
}

export default function DailyReceiptsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>جاري التحميل...</div>}>
      <DailyReceiptsContent />
    </Suspense>
  )
}

const thStyle: React.CSSProperties = { padding: '12px', fontSize: '14px', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '8px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', textAlign: 'center', fontSize: '14px', boxSizing: 'border-box' }