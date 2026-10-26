'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

const T = {
  titleVeg: '\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u062E\u0636\u0627\u0631 \u0627\u0644\u064A\u0648\u0645\u064A',
  titleFruit: '\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0641\u0648\u0627\u0643\u0647 \u0627\u0644\u064A\u0648\u0645\u064A',
  date: '\u0627\u0644\u062A\u0627\u0631\u064A\u062E',
  supplier: '\u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646',
  item: '\u0627\u0633\u0645 \u0627\u0644\u0635\u0646\u0641',
  totalQty: '\u0627\u0644\u0643\u0645\u064A\u0629 \u0627\u0644\u0643\u0644\u064A\u0629',
  price: '\u0627\u0644\u0633\u0639\u0631',
  totalPrice: '\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0639\u0627\u0645',
  brDakhil: '\u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u062F\u062E\u0644',
  brNasiriya: '\u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u0646\u0627\u0635\u0631\u064A\u0629',
  brTaj: '\u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u062A\u0627\u062C',
  brFourth: '\u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u0631\u0627\u0628\u0639',
  qty: '\u0627\u0644\u0643\u0645\u064A\u0629',
  total: '\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A',
  taxToggle: '\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0636\u0631\u064A\u0628\u0629 (15%)',
  save: '\u062D\u0641\u0638 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645',
  addRow: '+ \u0625\u0636\u0627\u0641\u0629 \u0635\u0646\u0641',
  success: '\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0628\u0646\u062C\u0627\u062D!',
}

function DailyReceiptsContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'vegetable'

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [isTaxEnabled, setIsTaxEnabled] = useState(type === 'fruit')
  
  const [branches, setBranches] = useState<any[]>([])

  const [rows, setRows] = useState<any[]>([
    { product_name: '', supplier_name: '', total_qty: 0, price: 0, dakhil_qty: 0, nasiriya_qty: 0, taj_qty: 0, fourth_qty: 0 }
  ])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: br } = await supabase.from('branches').select('id, name').eq('is_active', true)
      setBranches(br || [])
    }
    loadData()
  }, [])

  const handleRowChange = (index: number, field: string, value: any) => {
    const newRows = [...rows]
    newRows[index][field] = value
    setRows(newRows)
  }

  const addRow = () => {
    setRows([...rows, { product_name: '', supplier_name: '', total_qty: 0, price: 0, dakhil_qty: 0, nasiriya_qty: 0, taj_qty: 0, fourth_qty: 0 }])
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

      const { data: receipt, error: receiptError } = await supabase.from('daily_receipts').insert({
        company_id: userData.company_id, receipt_date: date, category_type: type, is_tax_enabled: isTaxEnabled,
      }).select('id').single()

      if (receiptError) throw receiptError

      for (const row of rows) {
        if (!row.product_name) continue;

        const { data: item, error: itemError } = await supabase.from('daily_receipt_items').insert({
          receipt_id: receipt.id,
          manual_product_name: row.product_name,
          manual_supplier_name: row.supplier_name,
          total_qty: row.total_qty || 0,
          unit_price: row.price || 0
        }).select('id').single()

        if (itemError) throw itemError

        const dist = [
          { qty: row.dakhil_qty, nameMatch: 'الدخل' },
          { qty: row.nasiriya_qty, nameMatch: 'الناصرية' },
          { qty: row.taj_qty, nameMatch: 'التاج' },
          { qty: row.fourth_qty, nameMatch: 'الرابع' }
        ]

        for (const d of dist) {
          if (d.qty > 0) {
            const branchId = branches.find(b => b.name.includes(d.nameMatch))?.id
            if (branchId) {
              await supabase.from('receipt_branch_allocations').insert({ receipt_item_id: item.id, branch_id: branchId, sent_qty: d.qty })
            }
          }
        }
      }

      setMessage(T.success)
      setRows([{ product_name: '', supplier_name: '', total_qty: 0, price: 0, dakhil_qty: 0, nasiriya_qty: 0, taj_qty: 0, fourth_qty: 0 }])
      
    } catch (err: any) {
      setMessage('حدث خطأ: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const getTitle = () => type === 'fruit' ? T.titleFruit : T.titleVeg

  return (
    <div style={{ padding: '10px', fontFamily: 'Arial', direction: 'rtl', overflowX: 'auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', background: 'white', padding: '10px 15px', borderRadius: '10px' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '22px' }}>{getTitle()}</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {type === 'fruit' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              <input type="checkbox" checked={isTaxEnabled} onChange={(e) => setIsTaxEnabled(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              {T.taxToggle}
            </label>
          )}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }} />
        </div>
      </div>

      {message && (
        <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '6px', background: '#d1fae5', color: '#065f46', fontWeight: 'bold' }}>{message}</div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', textAlign: 'center', fontSize: '13px', whiteSpace: 'nowrap' }}>
        <thead>
          <tr style={{ background: '#1e3a8a', color: 'white' }}>
            <th rowSpan={2} style={thStyle}>{T.date}</th>
            <th rowSpan={2} style={thStyle}>{T.supplier}</th>
            <th rowSpan={2} style={thStyle}>{T.item}</th>
            <th rowSpan={2} style={thStyle}>{T.totalQty}</th>
            <th rowSpan={2} style={thStyle}>{T.price}</th>
            <th rowSpan={2} style={thStyle}>{T.totalPrice}</th>
            <th colSpan={2} style={thStyle}>{T.brDakhil}</th>
            <th colSpan={2} style={thStyle}>{T.brNasiriya}</th>
            <th colSpan={2} style={thStyle}>{T.brTaj}</th>
            <th colSpan={2} style={thStyle}>{T.brFourth}</th>
          </tr>
          <tr style={{ background: '#3b82f6', color: 'white' }}>
            <th style={thStyle}>{T.qty}</th><th style={thStyle}>{T.total}</th>
            <th style={thStyle}>{T.qty}</th><th style={thStyle}>{T.total}</th>
            <th style={thStyle}>{T.qty}</th><th style={thStyle}>{T.total}</th>
            <th style={thStyle}>{T.qty}</th><th style={thStyle}>{T.total}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const totalPrice = row.total_qty * row.price;
            const dakhilTotal = row.dakhil_qty * row.price;
            const nasiriyaTotal = row.nasiriya_qty * row.price;
            const tajTotal = row.taj_qty * row.price;
            const fourthTotal = row.fourth_qty * row.price;

            return (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{date}</td>
                <td style={tdStyle}>
                  {/* حقل كتابة حر بدون قوائم منسدلة */}
                  <input type="text" placeholder="اكتب المورد..." value={row.supplier_name} onChange={(e) => handleRowChange(index, 'supplier_name', e.target.value)} style={inputStyle} />
                </td>
                <td style={tdStyle}>
                  {/* حقل كتابة حر بدون قوائم منسدلة */}
                  <input type="text" placeholder="اكتب الصنف..." value={row.product_name} onChange={(e) => handleRowChange(index, 'product_name', e.target.value)} style={inputStyle} />
                </td>
                <td style={tdStyle}><input type="number" value={row.total_qty || ''} onChange={(e) => handleRowChange(index, 'total_qty', Number(e.target.value))} style={inputStyle} /></td>
                <td style={tdStyle}><input type="number" value={row.price || ''} onChange={(e) => handleRowChange(index, 'price', Number(e.target.value))} style={inputStyle} /></td>
                <td style={{...tdStyle, fontWeight: 'bold'}}>{totalPrice.toFixed(2)}</td>
                
                <td style={tdStyle}><input type="number" value={row.dakhil_qty || ''} onChange={(e) => handleRowChange(index, 'dakhil_qty', Number(e.target.value))} style={inputStyle} /></td>
                <td style={tdStyle}>{dakhilTotal.toFixed(2)}</td>
                
                <td style={tdStyle}><input type="number" value={row.nasiriya_qty || ''} onChange={(e) => handleRowChange(index, 'nasiriya_qty', Number(e.target.value))} style={inputStyle} /></td>
                <td style={tdStyle}>{nasiriyaTotal.toFixed(2)}</td>
                
                <td style={tdStyle}><input type="number" value={row.taj_qty || ''} onChange={(e) => handleRowChange(index, 'taj_qty', Number(e.target.value))} style={inputStyle} /></td>
                <td style={tdStyle}>{tajTotal.toFixed(2)}</td>

                <td style={tdStyle}><input type="number" value={row.fourth_qty || ''} onChange={(e) => handleRowChange(index, 'fourth_qty', Number(e.target.value))} style={inputStyle} /></td>
                <td style={tdStyle}>{fourthTotal.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div style={{ marginTop: '15px', display: 'flex', gap: '15px' }}>
        <button onClick={addRow} style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{T.addRow}</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px 30px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{saving ? 'جاري الحفظ...' : T.save}</button>
      </div>
    </div>
  )
}

export default function DailyReceiptsPage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <DailyReceiptsContent />
    </Suspense>
  )
}

const thStyle: React.CSSProperties = { padding: '10px', border: '1px solid #1e40af', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '5px', border: '1px solid #e5e7eb' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center', boxSizing: 'border-box' }