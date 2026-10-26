'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'

const T = {
  title: 'التحويلات بين الفروع',
  subTitle: 'تخصم من الفرع المحول وتضاف للفرع المحول إليه',
  addNew: 'إضافة تحويل جديد',
  editTitle: 'تعديل التحويل',
  print: '🖨️ طباعة',
  export: '📥 تصدير Excel',
  date: 'التاريخ',
  fromBranch: 'من فرع',
  toBranch: 'إلى فرع',
  product: 'الصنف',
  qty: 'الكمية',
  price: 'سعر الوحدة',
  total: 'الإجمالي',
  notes: 'ملاحظات',
  save: 'حفظ التحويل',
  update: 'تحديث التحويل',
  cancel: 'إلغاء',
  last20: 'آخر 20 تحويل',
  noData: 'لا توجد تحويلات مسجلة',
  loading: 'جاري التحميل...',
  success: 'تم الحفظ بنجاح!',
  updateSuccess: 'تم التحديث بنجاح!',
  deleteSuccess: 'تم الحذف بنجاح!',
  confirmDelete: 'هل أنت متأكد من حذف هذا التحويل؟ سيتم تسجيل العملية في سجل التعديلات.',
  errorSameBranch: 'لا يمكن التحويل لنفس الفرع!',
  tableDate: 'التاريخ', tableFrom: 'من فرع', tableTo: 'إلى فرع', tableProduct: 'الصنف',
  tableQty: 'الكمية', tablePrice: 'السعر', tableTotal: 'الإجمالي',
  actions: 'الإجراءات', edit: 'تعديل', delete: 'حذف'
}

function TransfersContent() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  const [branches, setBranches] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    transfer_date: new Date().toISOString().slice(0, 10),
    from_branch_id: '', to_branch_id: '', product_id: '',
    qty: '', unit_price: '', notes: ''
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase.from('users').select('company_id').eq('auth_id', user.id).single()
    if (!userData) return
    setCompanyId(userData.company_id)

    const { data: br } = await supabase.from('branches').select('id, name').eq('is_active', true).eq('company_id', userData.company_id).order('name')
    setBranches(br || [])

    const { data: prod } = await supabase.from('products').select('id, name').eq('is_active', true).eq('company_id', userData.company_id).order('name')
    setProducts(prod || [])

    // جلب التحويلات مع أسماء الفروع (باستخدام Foreign Keys المحددة)
    const { data: tr } = await supabase
      .from('transfers')
      .select(`
        id, transfer_date, qty, unit_price, total, notes, from_branch_id, to_branch_id, product_id,
        from_branch:branches!transfers_from_branch_id_fkey(name),
        to_branch:branches!transfers_to_branch_id_fkey(name),
        products(name)
      `)
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setTransfers(tr || [])
    setLoading(false)
  }

  const qty = parseFloat(form.qty) || 0
  const price = parseFloat(form.unit_price) || 0
  const total = qty * price

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMessage('')
    const supabase = createClient()

    if (form.from_branch_id === form.to_branch_id) {
      setMessage(T.errorSameBranch); setSaving(false); return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: userInfo } = await supabase.from('users').select('id').eq('auth_id', user?.id).single()

    const record = {
      company_id: companyId, from_branch_id: form.from_branch_id, to_branch_id: form.to_branch_id,
      product_id: form.product_id || null, transfer_date: form.transfer_date,
      qty: qty, unit_price: price, total: total, notes: form.notes || null, created_by: userInfo?.id
    }

    if (editingId) {
      const oldRecord = transfers.find(t => t.id === editingId)
      const { error } = await supabase.from('transfers').update(record).eq('id', editingId)
      if (error) { setMessage('خطأ: ' + error.message); setSaving(false); return }
      
      await supabase.from('audit_logs').insert({
        company_id: companyId, user_id: userInfo?.id, action: 'تعديل تحويل', table_name: 'transfers',
        record_id: editingId, old_values: oldRecord, new_values: record
      })
      setMessage(T.updateSuccess)
    } else {
      const { data: insertedData, error } = await supabase.from('transfers').insert(record).select()
      if (error) { setMessage('خطأ: ' + error.message); setSaving(false); return }
      
      await supabase.from('audit_logs').insert({
        company_id: companyId, user_id: userInfo?.id, action: 'إضافة تحويل', table_name: 'transfers',
        record_id: insertedData[0].id, new_values: record
      })
      setMessage(T.success)
    }

    resetForm()
    await loadData()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!window.confirm(T.confirmDelete)) return
    const supabase = createClient()
    
    const oldRecord = transfers.find(t => t.id === id)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: userInfo } = await supabase.from('users').select('id').eq('auth_id', user?.id).single()

    const { error } = await supabase.from('transfers').delete().eq('id', id)
    if (error) { alert('خطأ: ' + error.message); return }
    
    await supabase.from('audit_logs').insert({
      company_id: companyId, user_id: userInfo?.id, action: 'حذف تحويل', table_name: 'transfers',
      record_id: id, old_values: oldRecord
    })

    setMessage(T.deleteSuccess)
    await loadData()
  }

  const handleEditClick = (row: any) => {
    setEditingId(row.id)
    setForm({
      transfer_date: row.transfer_date, from_branch_id: row.from_branch_id, to_branch_id: row.to_branch_id,
      product_id: row.product_id || '', qty: row.qty.toString(), unit_price: row.unit_price.toString(), notes: row.notes || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({ ...form, qty: '', unit_price: '', notes: '' })
  }

  const handleExport = () => {
    const excelData = transfers.map(t => ({
      'التاريخ': t.transfer_date,
      'من فرع': (t.from_branch as any)?.name || (t.from_branch as any)?.[0]?.name || '',
      'إلى فرع': (t.to_branch as any)?.name || (t.to_branch as any)?.[0]?.name || '',
      'الصنف': (t.products as any)?.name || '',
      'الكمية': t.qty, 'سعر الوحدة': t.unit_price, 'الإجمالي': t.total, 'ملاحظات': t.notes || ''
    }))
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "التحويلات")
    XLSX.writeFile(wb, `التحويلات_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl' }}>
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#065f46', fontSize: '24px' }}>{T.title}</h1>
          <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>{T.subTitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} style={btnStyle('#059669')}>{T.print}</button>
          <button onClick={handleExport} style={btnStyle('#2563eb')}>{T.export}</button>
        </div>
      </div>

      {message && (
        <div className="no-print" style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', background: message.includes('بنجاح') ? '#d1fae5' : '#fee2e2', color: message.includes('بنجاح') ? '#065f46' : '#991b1b', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      {/* نموذج الإدخال / التعديل */}
      <div className="no-print" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px', border: editingId ? '2px solid #3b82f6' : 'none' }}>
        <h2 style={{ margin: '0 0 15px', color: editingId ? '#1d4ed8' : '#065f46', fontSize: '18px' }}>
          {editingId ? T.editTitle : T.addNew}
        </h2>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
            <div><label style={labelStyle}>{T.date}</label><input type="date" value={form.transfer_date} onChange={e => setForm({...form, transfer_date: e.target.value})} required style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>{T.fromBranch}</label>
              <select value={form.from_branch_id} onChange={e => setForm({...form, from_branch_id: e.target.value})} required style={inputStyle}>
                <option value="">اختر الفرع المحول منه</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{T.toBranch}</label>
              <select value={form.to_branch_id} onChange={e => setForm({...form, to_branch_id: e.target.value})} required style={inputStyle}>
                <option value="">اختر الفرع المحول إليه</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{T.product}</label>
              <select value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} required style={inputStyle}>
                <option value="">اختر الصنف</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>{T.qty}</label><input type="number" step="0.01" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} required style={inputStyle} /></div>
            <div><label style={labelStyle}>{T.price}</label><input type="number" step="0.01" value={form.unit_price} onChange={e => setForm({...form, unit_price: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>{T.total}</label><input type="text" value={total.toFixed(2)} readOnly style={{...inputStyle, background: '#dcfce7', fontWeight: 'bold', color: '#065f46'}} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>{T.notes}</label><input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={inputStyle} /></div>
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={saving} style={{ padding: '12px 30px', background: saving ? '#9ca3af' : (editingId ? '#3b82f6' : '#059669'), color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
              {saving ? 'جاري الحفظ...' : (editingId ? T.update : T.save)}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} style={{ padding: '12px 20px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {T.cancel}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* جدول العرض */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '18px' }}>{T.last20}</h2>
        {transfers.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>{T.noData}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#f0fdf4', color: '#065f46', borderBottom: '2px solid #059669' }}>
                  <th style={thStyle}>{T.tableDate}</th><th style={thStyle}>{T.tableFrom}</th><th style={thStyle}>{T.tableTo}</th>
                  <th style={thStyle}>{T.tableProduct}</th><th style={thStyle}>{T.tableQty}</th><th style={thStyle}>{T.tablePrice}</th>
                  <th style={thStyle}>{T.tableTotal}</th><th className="no-print" style={thStyle}>{T.actions}</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #e5e7eb', background: editingId === t.id ? '#eff6ff' : 'transparent' }}>
                    <td style={tdStyle}>{t.transfer_date}</td>
                    <td style={tdStyle}>{(t.from_branch as any)?.name || (t.from_branch as any)?.[0]?.name}</td>
                    <td style={tdStyle}>{(t.to_branch as any)?.name || (t.to_branch as any)?.[0]?.name}</td>
                    <td style={{...tdStyle, fontWeight: 'bold'}}>{(t.products as any)?.name}</td>
                    <td style={tdStyle}>{t.qty}</td>
                    <td style={tdStyle}>{t.unit_price}</td>
                    <td style={{...tdStyle, fontWeight: 'bold', color: '#059669'}}>{t.total}</td>
                    <td className="no-print" style={tdStyle}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => handleEditClick(t)} style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{T.edit}</button>
                        <button onClick={() => handleDelete(t.id)} style={{ padding: '6px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{T.delete}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          body { background: white !important; }
          table { font-size: 11px !important; }
        }
      `}</style>
    </div>
  )
}

export default function TransfersPage() {
  return <Suspense fallback={<div>جاري التحميل...</div>}><TransfersContent /></Suspense>
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }
const thStyle: React.CSSProperties = { padding: '12px', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '10px' }
const btnStyle = (bg: string): React.CSSProperties => ({ padding: '10px 20px', background: bg, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' })