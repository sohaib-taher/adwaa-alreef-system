'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PurchasesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [branches, setBranches] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])

  const [form, setForm] = useState({
    purchase_date: new Date().toISOString().split('T')[0],
    branch_id: '', category_id: '', product_id: '', supplier_id: '',
    qty: '', unit_price: '', notes: '',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }

    const [br, cat, prod, sup, pur] = await Promise.all([
      supabase.from('branches').select('id, name').eq('is_active', true).order('name'),
      supabase.from('categories').select('id, name, type, has_tax, tax_rate').eq('is_active', true).order('name'),
      supabase.from('products').select('id, name, category_id').eq('is_active', true).order('name'),
      supabase.from('suppliers').select('id, name').eq('is_active', true).order('name'),
      supabase.from('purchases').select(`id, purchase_date, qty, unit_price, total_with_tax, branches(name), categories(name), products(name), suppliers(name)`).order('created_at', { ascending: false }).limit(20),
    ])

    setBranches(br.data || [])
    setCategories(cat.data || [])
    setProducts(prod.data || [])
    setSuppliers(sup.data || [])
    setPurchases(pur.data || [])
    setLoading(false)
  }

  const filteredProducts = form.category_id ? products.filter(p => p.category_id === form.category_id) : products
  const selectedCategory = categories.find(c => c.id === form.category_id)
  const total = (parseFloat(form.qty) || 0) * (parseFloat(form.unit_price) || 0)
  const taxAmount = selectedCategory?.has_tax ? total * ((selectedCategory.tax_rate || 0) / 100) : 0
  const totalWithTax = total + taxAmount

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMessage('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase.from('users').select('company_id, id').eq('auth_id', user.id).single()
    if (!userData) { setMessage('❌ لم يتم العثور على بيانات المستخدم'); setSaving(false); return }

    const { error } = await supabase.from('purchases').insert({
      company_id: userData.company_id,
      branch_id: form.branch_id, category_id: form.category_id,
      product_id: form.product_id || null, supplier_id: form.supplier_id || null,
      purchase_date: form.purchase_date,
      qty: parseFloat(form.qty) || 0, unit_price: parseFloat(form.unit_price) || 0,
      total, tax_amount: taxAmount, total_with_tax: totalWithTax,
      notes: form.notes || null, created_by: userData.id,
    })

    if (error) { setMessage('❌ خطأ: ' + error.message); setSaving(false); return }
    setMessage('✅ تم حفظ المشتريات بنجاح!')
    setForm({ ...form, product_id: '', qty: '', unit_price: '', notes: '' })
    await loadData()
    setSaving(false)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#059669' }}>جاري التحميل...</div>

  return (
    <div>
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '26px' }}>🛒 إدارة المشتريات</h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>إدخال ومتابعة المشتريات لكل الفروع</p>
      </div>

      {/* النموذج */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '25px' }}>
        <h2 style={{ margin: '0 0 20px', color: '#065f46', fontSize: '17px' }}>➕ إضافة مشترى جديد</h2>

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
            <Field label="التاريخ *">
              <input type="date" value={form.purchase_date} onChange={e => setForm({...form, purchase_date: e.target.value})} required style={input} />
            </Field>
            <Field label="الفرع *">
              <select value={form.branch_id} onChange={e => setForm({...form, branch_id: e.target.value})} required style={input}>
                <option value="">اختر الفرع</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="التصنيف *">
              <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value, product_id: ''})} required style={input}>
                <option value="">اختر التصنيف</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name} {c.has_tax ? '(ضريبة)' : ''}</option>)}
              </select>
            </Field>
            <Field label="الصنف">
              <select value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} style={input}>
                <option value="">اختر الصنف</option>
                {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="المورد">
              <select value={form.supplier_id} onChange={e => setForm({...form, supplier_id: e.target.value})} style={input}>
                <option value="">اختر المورد</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="الكمية *">
              <input type="number" step="0.01" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} required style={input} />
            </Field>
            <Field label="سعر الوحدة *">
              <input type="number" step="0.01" value={form.unit_price} onChange={e => setForm({...form, unit_price: e.target.value})} required style={input} />
            </Field>
            <Field label="المبلغ">
              <input type="text" value={total.toFixed(2)} readOnly style={{...input, background: '#f3f4f6', fontWeight: 'bold'}} />
            </Field>
            {selectedCategory?.has_tax && (
              <Field label="الضريبة 15%">
                <input type="text" value={taxAmount.toFixed(2)} readOnly style={{...input, background: '#fef3c7', color: '#92400e'}} />
              </Field>
            )}
            <Field label="الإجمالي النهائي">
              <input type="text" value={totalWithTax.toFixed(2)} readOnly style={{...input, background: '#d1fae5', fontWeight: 'bold', color: '#065f46'}} />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="ملاحظات">
                <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={input} placeholder="ملاحظات إضافية..." />
              </Field>
            </div>
          </div>

          <button type="submit" disabled={saving} style={{
            marginTop: '20px', padding: '14px 40px',
            background: saving ? '#9ca3af' : '#059669', color: 'white',
            border: 'none', borderRadius: '10px', fontSize: '16px',
            fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
          }}>
            {saving ? 'جاري الحفظ...' : '💾 حفظ المشترى'}
          </button>

          {message && (
            <div style={{ marginTop: '15px', padding: '12px', borderRadius: '8px',
              background: message.includes('✅') ? '#d1fae5' : '#fee2e2',
              color: message.includes('✅') ? '#065f46' : '#991b1b', fontWeight: 'bold', fontSize: '14px' }}>
              {message}
            </div>
          )}
        </form>
      </div>

      {/* الجدول */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '17px' }}>📋 آخر 20 مشترى</h2>
        {purchases.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>لا توجد مشتريات بعد</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f0fdf4', color: '#065f46' }}>
                  <th style={th}>التاريخ</th>
                  <th style={th}>الفرع</th>
                  <th style={th}>التصنيف</th>
                  <th style={th}>الصنف</th>
                  <th style={th}>المورد</th>
                  <th style={th}>الكمية</th>
                  <th style={th}>السعر</th>
                  <th style={th}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={td}>{p.purchase_date}</td>
                    <td style={td}>{p.branches?.name}</td>
                    <td style={td}>{p.categories?.name}</td>
                    <td style={td}>{p.products?.name}</td>
                    <td style={td}>{p.suppliers?.name}</td>
                    <td style={td}>{p.qty}</td>
                    <td style={td}>{p.unit_price}</td>
                    <td style={{...td, fontWeight: 'bold', color: '#059669'}}>{p.total_with_tax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: any) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}

const input: React.CSSProperties = {
  width: '100%', padding: '11px 14px', border: '2px solid #e5e7eb',
  borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box',
  color: '#111827', background: '#fff', outline: 'none', fontFamily: 'inherit'
}
const th: React.CSSProperties = { padding: '12px', textAlign: 'right', fontSize: '12px' }
const td: React.CSSProperties = { padding: '11px 12px', textAlign: 'right', color: '#374151' }