'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

const T = {
  titleVeg: '\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u062E\u0636\u0627\u0631 \u0627\u0644\u064A\u0648\u0645\u064A',
  titleFruit: '\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0641\u0648\u0627\u0643\u0647 \u0627\u0644\u064A\u0648\u0645\u064A',
  titlePaper: '\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0648\u0631\u0642\u064A\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A',
  item: '\u0627\u0644\u0635\u0646\u0641',
  supplier: '\u0627\u0644\u0645\u0648\u0631\u062F',
  totalQty: '\u0627\u0644\u0643\u0645\u064A\u0629 \u0627\u0644\u0643\u0644\u064A\u0629',
  price: '\u0627\u0644\u0633\u0639\u0631',
  total: '\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A',
  brDakhil: '\u0627\u0644\u062F\u062E\u0644',
  brNasiriya: '\u0627\u0644\u0646\u0627\u0635\u0631\u064A\u0629',
  brTaj: '\u0627\u0644\u062A\u0627\u062C',
  taxToggle: '\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0636\u0631\u064A\u0628\u0629 (15%)',
  save: '\u062D\u0641\u0638 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645',
  addRow: '+ \u0625\u0636\u0627\u0641\u0629 \u0635\u0646\u0641',
}

function DailyReceiptsContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'vegetable'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [isTaxEnabled, setIsTaxEnabled] = useState(type === 'fruit')
  
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])

  const [rows, setRows] = useState<any[]>([
    { product_id: '', supplier_id: '', total_qty: 0, price: 0, dakhil: 0, nasiriya: 0, taj: 0 }
  ])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      const { data: br } = await supabase.from('branches').select('id, name').eq('is_active', true).order('name')
      setBranches(br || [])

      const { data: sup } = await supabase.from('suppliers').select('id, name').eq('is_active', true).order('name')
      setSuppliers(sup || [])

      const { data: cat } = await supabase.from('categories').select('id').eq('type', type).single()
      if (cat) {
        const { data: prod } = await supabase.from('products').select('id, name').eq('category_id', cat.id).eq('is_active', true).order('name')
        setProducts(prod || [])
      }

      setLoading(false)
    }
    loadData()
  }, [type])

  const handleRowChange = (index: number, field: string, value: any) => {
    const newRows = [...rows]
    newRows[index][field] = value
    setRows(newRows)
  }

  const addRow = () => {
    setRows([...rows, { product_id: '', supplier_id: '', total_qty: 0, price: 0, dakhil: 0, nasiriya: 0, taj: 0 }])
  }

  const getTitle = () => {
    if (type === 'fruit') return T.titleFruit
    if (type === 'paper') return T.titlePaper
    return T.titleVeg
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>جاري التحميل...</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl' }}>
      
      {/* الشريط العلوي */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '24px' }}>{getTitle()}</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {type === 'fruit' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#f3f4f6', padding: '8px 15px', borderRadius: '8px' }}>
              <input 
                type="checkbox" 
                checked={isTaxEnabled} 
                onChange={(e) => setIsTaxEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px' }}
              />
              <span style={{ fontWeight: 'bold', color: '#374151' }}>{T.taxToggle}</span>
            </label>
          )}
          
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          />
        </div>
      </div>

      {/* الجدول */}
      <div style={{ background: 'white', borderRadius: '10px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead style={{ background: '#065f46', color: 'white' }}>
            <tr>
              <th style={thStyle}>{T.item}</th>
              <th style={thStyle}>{T.supplier}</th>
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
                  <td style={tdStyle}>
                    <select value={row.product_id} onChange={(e) => handleRowChange(index, 'product_id', e.target.value)} style={inputStyle}>
                      <option value="">اختر الصنف</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <select value={row.supplier_id} onChange={(e) => handleRowChange(index, 'supplier_id', e.target.value)} style={inputStyle}>
                      <option value="">اختر المورد</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>
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

      {/* أزرار التحكم */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
        <button onClick={addRow} style={{ padding: '12px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          {T.addRow}
        </button>
        <button disabled={saving} style={{ padding: '12px 30px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          {saving ? 'جاري الحفظ...' : T.save}
        </button>
      </div>

    </div>
  )
}

// هذا الغلاف مهم جداً ليعمل الكود على Vercel بدون أخطاء
export default function DailyReceiptsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>جاري التحميل...</div>}>
      <DailyReceiptsContent />
    </Suspense>
  )
}

const thStyle: React.CSSProperties = { padding: '12px', fontSize: '14px', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '8px' }
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  textAlign: 'center',
  fontSize: '14px',
  boxSizing: 'border-box'
}