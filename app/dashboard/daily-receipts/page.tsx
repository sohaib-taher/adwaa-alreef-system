'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

const T = {
  titleVeg: 'استلام الخضار اليومي',
  titleFruit: 'استلام الفواكه اليومي',
  titlePaper: 'استلام الورقيات اليومي',
  print: '🖨️ طباعة الكشف',
  date: 'التاريخ',
  supplier: 'الموردين',
  item: 'اسم الصنف',
  totalQty: 'الكمية الكلية',
  price: 'السعر',
  totalPrice: 'الإجمالي العام',
  brDakhil: 'الفرع الدخل',
  brNasiriya: 'الفرع الناصرية',
  brTaj: 'الفرع التاج',
  brFourth: 'الفرع الرابع',
  qty: 'الكمية',
  total: 'الإجمالي',
  taxToggle: 'تفعيل الضريبة (15%)',
  save: 'حفظ الاستلام',
  post: 'ترحيل إلى فواتير المشتريات',
  addRow: '+ إضافة صنف',
  success: 'تم حفظ الاستلام بنجاح!',
  posted: 'تم الترحيل بنجاح!',
  footerTotal: 'الإجمالي الكلي',
  vat: 'ضريبة القيمة المضافة (15%)',
  grandTotal: 'الإجمالي الكلي بعد الضريبة',
  error: 'حدث خطأ'
}

function DailyReceiptsContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'vegetable'

  const [saving, setSaving] = useState(false)
  const [posting, setPosting] = useState(false)
  const [message, setMessage] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [isTaxEnabled, setIsTaxEnabled] = useState(type === 'fruit')
  const [branches, setBranches] = useState<any[]>([])
  const [savedReceiptId, setSavedReceiptId] = useState<string | null>(null)

  const [rows, setRows] = useState<any[]>([
    { product_name: '', supplier_name: '', price: 0, dakhil_qty: 0, nasiriya_qty: 0, taj_qty: 0, fourth_qty: 0 }
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

  const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
    e.preventDefault()
    const clipboardData = e.clipboardData.getData('Text')
    const pastedRows = clipboardData.split(/\r?\n/).filter(row => row.trim() !== '')
    
    const newRows: any[] = []
    pastedRows.forEach((rowStr) => {
      const cols = rowStr.split('\t')
      if (cols.length >= 7) {
        newRows.push({
          supplier_name: cols[0] || '', product_name: cols[1] || '',
          price: Number(cols[2]) || 0, dakhil_qty: Number(cols[3]) || 0,
          nasiriya_qty: Number(cols[4]) || 0, taj_qty: Number(cols[5]) || 0, fourth_qty: Number(cols[6]) || 0,
        })
      }
    })

    if (newRows.length > 0) {
      setRows(newRows)
      alert(`تم لصق ${newRows.length} صنف بنجاح!`)
    }
  }

  const addRow = () => setRows([...rows, { product_name: '', supplier_name: '', price: 0, dakhil_qty: 0, nasiriya_qty: 0, taj_qty: 0, fourth_qty: 0 }])

  const getRowTotalQty = (row: any) => (Number(row.dakhil_qty) || 0) + (Number(row.nasiriya_qty) || 0) + (Number(row.taj_qty) || 0) + (Number(row.fourth_qty) || 0)
  const getRowTotalPrice = (row: any) => getRowTotalQty(row) * (Number(row.price) || 0)

  const totals = rows.reduce((acc, row) => {
    const rowQty = getRowTotalQty(row)
    const rowPrice = getRowTotalPrice(row)
    return {
      dakhil_qty: acc.dakhil_qty + (Number(row.dakhil_qty) || 0),
      dakhil_total: acc.dakhil_total + ((Number(row.dakhil_qty) || 0) * (Number(row.price) || 0)),
      nasiriya_qty: acc.nasiriya_qty + (Number(row.nasiriya_qty) || 0),
      nasiriya_total: acc.nasiriya_total + ((Number(row.nasiriya_qty) || 0) * (Number(row.price) || 0)),
      taj_qty: acc.taj_qty + (Number(row.taj_qty) || 0),
      taj_total: acc.taj_total + ((Number(row.taj_qty) || 0) * (Number(row.price) || 0)),
      fourth_qty: acc.fourth_qty + (Number(row.fourth_qty) || 0),
      fourth_total: acc.fourth_total + ((Number(row.fourth_qty) || 0) * (Number(row.price) || 0)),
      total_qty: acc.total_qty + rowQty,
      total_price: acc.total_price + rowPrice,
    }
  }, { dakhil_qty: 0, dakhil_total: 0, nasiriya_qty: 0, nasiriya_total: 0, taj_qty: 0, taj_total: 0, fourth_qty: 0, fourth_total: 0, total_qty: 0, total_price: 0 })

  const taxAmount = isTaxEnabled ? totals.total_price * 0.15 : 0
  const grandTotal = totals.total_price + taxAmount

  async function handleSave() {
    setSaving(true); setMessage(''); setSavedReceiptId(null);
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
      setSavedReceiptId(receipt.id)

      for (const row of rows) {
        if (!row.product_name) continue;
        const rowTotalQty = getRowTotalQty(row)
        const { data: item, error: itemError } = await supabase.from('daily_receipt_items').insert({
          receipt_id: receipt.id, manual_product_name: row.product_name, manual_supplier_name: row.supplier_name,
          total_qty: rowTotalQty, unit_price: Number(row.price) || 0
        }).select('id').single()

        if (itemError) throw itemError
        const dist = [
          { qty: row.dakhil_qty, nameMatch: 'الدخل' }, { qty: row.nasiriya_qty, nameMatch: 'الناصرية' },
          { qty: row.taj_qty, nameMatch: 'التاج' }, { qty: row.fourth_qty, nameMatch: 'الرابع' }
        ]
        for (const d of dist) {
          if (Number(d.qty) > 0) {
            const branchId = branches.find(b => b.name.includes(d.nameMatch))?.id
            if (branchId) await supabase.from('receipt_branch_allocations').insert({ receipt_item_id: item.id, branch_id: branchId, sent_qty: Number(d.qty) })
          }
        }
      }
      setMessage(T.success)
    } catch (err: any) {
      setMessage(T.error + ': ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePostToPurchases() {
    if (!savedReceiptId) return
    setPosting(true)
    const supabase = createClient()
    try {
      const { data: items } = await supabase.from('daily_receipt_items').select('*').eq('receipt_id', savedReceiptId)
      if (!items || items.length === 0) throw new Error('لا توجد أصناف')
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userData } = await supabase.from('users').select('company_id, id').eq('auth_id', user!.id).single()

      const itemsBySupplier: any = {}
      items.forEach(item => {
        const supplier = item.manual_supplier_name || 'مورد غير محدد'
        if (!itemsBySupplier[supplier]) itemsBySupplier[supplier] = []
        itemsBySupplier[supplier].push(item)
      })

      for (const supplierName in itemsBySupplier) {
        for (const item of itemsBySupplier[supplierName]) {
          const total = (Number(item.total_qty) || 0) * (Number(item.unit_price) || 0)
          const tax = isTaxEnabled ? total * 0.15 : 0
          await supabase.from('purchases').insert({
            company_id: userData!.company_id, branch_id: null, purchase_date: date,
            manual_product_name: item.manual_product_name, manual_supplier_name: supplierName,
            qty: item.total_qty, unit_price: item.unit_price, total: total,
            tax_amount: tax, total_with_tax: total + tax, created_by: userData!.id, daily_receipt_id: savedReceiptId
          })
        }
      }
      await supabase.from('daily_receipts').update({ is_posted_to_purchases: true }).eq('id', savedReceiptId)
      setMessage(T.posted)
      setRows([{ product_name: '', supplier_name: '', price: 0, dakhil_qty: 0, nasiriya_qty: 0, taj_qty: 0, fourth_qty: 0 }])
      setSavedReceiptId(null)
    } catch (err: any) {
      setMessage(T.error + ': ' + err.message)
    } finally {
      setPosting(false)
    }
  }

  const getTitle = () => type === 'fruit' ? T.titleFruit : type === 'paper' ? T.titlePaper : T.titleVeg

  return (
    <div style={{ padding: '10px', fontFamily: 'Arial', direction: 'rtl', overflowX: 'auto' }}>
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', background: 'white', padding: '10px 15px', borderRadius: '10px' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '22px' }}>{getTitle()}</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {type === 'fruit' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 'bold', color: '#b91c1c' }}>
              <input type="checkbox" checked={isTaxEnabled} onChange={(e) => setIsTaxEnabled(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              {T.taxToggle}
            </label>
          )}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }} />
          <button onClick={() => window.print()} style={{ padding: '8px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {T.print}
          </button>
        </div>
      </div>

      {message && <div className="no-print" style={{ padding: '10px', marginBottom: '15px', borderRadius: '6px', background: message.includes('بنجاح') ? '#d1fae5' : '#fee2e2', color: message.includes('بنجاح') ? '#065f46' : '#991b1b', fontWeight: 'bold' }}>{message}</div>}

      <table onPaste={handlePaste} style={{ width: '100%', borderCollapse: 'collapse', background: 'white', textAlign: 'center', fontSize: '13px', whiteSpace: 'nowrap' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: 'white' }}>
            <th rowSpan={2} style={thStyle}>{T.date}</th><th rowSpan={2} style={thStyle}>{T.supplier}</th><th rowSpan={2} style={thStyle}>{T.item}</th>
            <th rowSpan={2} style={thStyle}>{T.totalQty}</th><th rowSpan={2} style={thStyle}>{T.price}</th><th rowSpan={2} style={thStyle}>{T.totalPrice}</th>
            <th colSpan={2} style={thStyle}>{T.brDakhil}</th><th colSpan={2} style={thStyle}>{T.brNasiriya}</th>
            <th colSpan={2} style={thStyle}>{T.brTaj}</th><th colSpan={2} style={thStyle}>{T.brFourth}</th>
          </tr>
          <tr style={{ background: '#1e3a8a', color: 'white' }}>
            <th style={thStyle}>{T.qty}</th><th style={thStyle}>{T.total}</th><th style={thStyle}>{T.qty}</th><th style={thStyle}>{T.total}</th>
            <th style={thStyle}>{T.qty}</th><th style={thStyle}>{T.total}</th><th style={thStyle}>{T.qty}</th><th style={thStyle}>{T.total}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rowQty = getRowTotalQty(row)
            const rowTotalPrice = getRowTotalPrice(row)
            const dakhilTotal = (Number(row.dakhil_qty) || 0) * (Number(row.price) || 0)
            const nasiriyaTotal = (Number(row.nasiriya_qty) || 0) * (Number(row.price) || 0)
            const tajTotal = (Number(row.taj_qty) || 0) * (Number(row.price) || 0)
            const fourthTotal = (Number(row.fourth_qty) || 0) * (Number(row.price) || 0)
            return (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{date}</td>
                <td style={tdStyle}><input type="text" value={row.supplier_name} onChange={(e) => handleRowChange(index, 'supplier_name', e.target.value)} style={inputStyle} /></td>
                <td style={tdStyle}><input type="text" value={row.product_name} onChange={(e) => handleRowChange(index, 'product_name', e.target.value)} style={inputStyle} /></td>
                <td style={{...tdStyle, fontWeight: 'bold', background: '#f3f4f6'}}>{rowQty}</td>
                <td style={tdStyle}><input type="number" value={row.price || ''} onChange={(e) => handleRowChange(index, 'price', Number(e.target.value))} style={inputStyle} /></td>
                <td style={{...tdStyle, fontWeight: 'bold', color: '#065f46'}}>{rowTotalPrice.toFixed(2)}</td>
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
        <tfoot>
          <tr style={{ background: '#f3f4f6', fontWeight: 'bold', color: '#111827', fontSize: '14px' }}>
            <td colSpan={3} style={{ padding: '10px', textAlign: 'center' }}>{T.footerTotal}</td>
            <td style={tdStyle}>{totals.total_qty}</td><td style={tdStyle}>-</td><td style={tdStyle}>{totals.total_price.toFixed(2)}</td>
            <td style={tdStyle}>{totals.dakhil_qty}</td><td style={tdStyle}>{totals.dakhil_total.toFixed(2)}</td>
            <td style={tdStyle}>{totals.nasiriya_qty}</td><td style={tdStyle}>{totals.nasiriya_total.toFixed(2)}</td>
            <td style={tdStyle}>{totals.taj_qty}</td><td style={tdStyle}>{totals.taj_total.toFixed(2)}</td>
            <td style={tdStyle}>{totals.fourth_qty}</td><td style={tdStyle}>{totals.fourth_total.toFixed(2)}</td>
          </tr>
          {type === 'fruit' && isTaxEnabled && (
            <>
              <tr style={{ background: '#fef3c7', fontWeight: 'bold', color: '#92400e' }}>
                <td colSpan={5} style={{ padding: '10px', textAlign: 'center' }}>{T.vat}</td><td colSpan={9} style={{ padding: '10px', textAlign: 'center' }}>{taxAmount.toFixed(2)}</td>
              </tr>
              <tr style={{ background: '#dcfce7', fontWeight: 'bold', color: '#166534' }}>
                <td colSpan={5} style={{ padding: '10px', textAlign: 'center' }}>{T.grandTotal}</td><td colSpan={9} style={{ padding: '10px', textAlign: 'center' }}>{grandTotal.toFixed(2)}</td>
              </tr>
            </>
          )}
        </tfoot>
      </table>

      <div className="no-print" style={{ marginTop: '15px', display: 'flex', gap: '15px' }}>
        <button onClick={addRow} style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{T.addRow}</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px 30px', background: saving ? '#9ca3af' : '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>{saving ? 'جاري الحفظ...' : T.save}</button>
        {savedReceiptId && (
          <button onClick={handlePostToPurchases} disabled={posting} style={{ padding: '10px 30px', background: posting ? '#9ca3af' : '#ca8a04', color: 'white', border: 'none', borderRadius: '6px', cursor: posting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            {posting ? 'جاري الترحيل...' : T.post}
          </button>
        )}
      </div>

      <style jsx global>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          body { background: white !important; }
          input { border: none !important; background: transparent !important; }
          table { font-size: 11px !important; }
        }
      `}</style>
    </div>
  )
}

export default function DailyReceiptsPage() { return <Suspense fallback={<div>جاري التحميل...</div>}><DailyReceiptsContent /></Suspense> }

const thStyle: React.CSSProperties = { padding: '10px', border: '1px solid #1e40af', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '5px', border: '1px solid #e5e7eb' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center', boxSizing: 'border-box' }