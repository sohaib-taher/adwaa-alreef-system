'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const today = new Date().toISOString().slice(0, 10)

export default function TransfersPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [branches, setBranches] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')

  const [form, setForm] = useState({
    transfer_date: today,
    from_branch_id: '',
    to_branch_id: '',
    product_id: '',
    qty: '',
    unit_price: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const userRes = await supabase.auth.getUser()
    if (!userRes.data.user) {
      window.location.href = '/'
      return
    }
    const userInfoRes = await supabase
      .from('users')
      .select('company_id')
      .eq('auth_id', userRes.data.user.id)
      .single()
    const cid = userInfoRes.data?.company_id || ''
    setCompanyId(cid)

    const br = await supabase
      .from('branches')
      .select('id, name')
      .eq('is_active', true)
      .eq('company_id', cid)
      .order('name')

    const prod = await supabase
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .eq('company_id', cid)
      .order('name')

    const tr = await supabase
      .from('transfers')
      .select(
        'id, transfer_date, qty, unit_price, total, notes, products(name), from_branch:branches!transfers_from_b059ranch_id_fkey(name), to_branch:branches!transfers_to_branch_id_fkey(name)'
      )
      .eq('company_id', cid)
      .order('created_at', { ascending: false })
      .limit(20)

    setBranches(br.data || [])
    setProducts(prod.data || [])
    setTransfers(tr.data || [])
    setLoading(false)
  }

  const total = (parseFloat(form.qty) || 0) * (parseFloat(form.unit_price) || 0)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (form.from_branch_id === form.to_branch_id) {
      setMessage('لا يمكن التحويل لنفس الفرع')
      return
    }
    setSaving(true)
    setMessage('')

    const supabase = createClient()
    const userRes = await supabase.auth.getUser()
    if (!userRes.data.user) return

    const userInfoRes = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userRes.data.user.id)
      .single()

    const insertRes = await supabase.from('transfers').insert({
      company_id: companyId,
      from_branch_id: form.from_branch_id,
      to_branch_id: form.to_branch_id,
      product_id: form.product_id || null,
      transfer_date: form.transfer_date,
      qty: parseFloat(form.qty) || 0,
      unit_price: parseFloat(form.unit_price) || 0,
      total: total,
      notes: form.notes || null,
      created_by: userInfoRes.data?.id,
    })

    if (insertRes.error) {
      setMessage('خطأ: ' + insertRes.error.message)
      setSaving(false)
      return
    }

    setMessage('تم حفظ التحويل بنجاح')
    setForm({ ...form, product_id: '', qty: '', unit_price: '', notes: '' })
    await loadData()
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: '#669' }}>
        جاري التحميل...
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '26px' }}>
          التحويلات بين الفروع
        </h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>
          تخصم من الفرع المحول وتضاف للفرع المحول إليه
        </p>
      </div>

      <div
        style={{
          background: 'white',
          padding: '25px',
          borderRadius: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          marginBottom: '25px',
        }}
      >
        <h2 style={{ margin: '0 0 20px', color: '#065f46', fontSize: '17px' }}>
          إضافة تحويل جديد
        </h2>

        <form onSubmit={handleSave}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '15px',
            }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>
                التاريخ
              </label>
              <input
                type="date"
                value={form.transfer_date}
                onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
                required
                style={input}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>
                من فرع
              </label>
              <select
                value={form.from_branch_id}
                onChange={(e) => setForm({ ...form, from_branch_id: e.target.value })}
                required
                style={input}
              >
                <option value="">اختر الفرع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>
                إلى فرع
              </label>
              <select
                value={form.to_branch_id}
                onChange={(e) => setForm({ ...form, to_branch_id: e.target.value })}
                required
                style={input}
              >
                <option value="">اختر الفرع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>
                الصنف
              </label>
              <select
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                required
                style={input}
              >
                <option value="">اختر الصنف</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>
                الكمية
              </label>
              <input
                type="number"
                step="0.01"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
                required
                style={input}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>
                سعر الوحدة
              </label>
              <input
                type="number"
                step="0.01"
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                style={input}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>
                الإجمالي
              </label>
              <input
                type="text"
                value={total.toFixed(2)}
                readOnly
                style={{ ...input, background: '#d1fae5', fontWeight: 'bold', color: '#065f46' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>
                ملاحظات
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                style={input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: '20px',
              padding: '14px 40px',
              background: saving ? '#9ca3af' : '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التحويل'}
          </button>

          {message !== '' && (
            <div
              style={{
                marginTop: '15px',
                padding: '12px',
                borderRadius: '8px',
                background: message.includes('بنجاح') ? '#d1fae5' : '#fee2e2',
                color: message.includes('بنجاح') ? '#065f46' : '#991b1b',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              {message}
            </div>
          )}
        </form>
      </div>

      <div
        style={{
          background: 'white',
          padding: '25px',
          borderRadius: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '17px' }}>
          آخر 20 تحويل
        </h2>

        {transfers.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
            لا توجد تحويلات بعد
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr style={{ background: '#f0fdf4', color: '#065f46' }}>
                  <th style={th}>التاريخ</th>
                  <th style={th}>من فرع</th>
                  <th style={th}>إلى فرع</th>
                  <th style={th}>الصنف</th>
                  <th style={th}>الكمية</th>
                  <th style={th}>السعر</th>
                  <th style={th}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={td}>{t.transfer_date}</td>
                    <td style={td}>{t.from_branch?.name}</td>
                    <td style={td}>{t.to_branch?.name}</td>
                    <td style={td}>{t.products?.name}</td>
                    <td style={td}>{t.qty}</td>
                    <td style={td}>{t.unit_price}</td>
                    <td style={{ ...td, fontWeight: 'bold', color: '#059669' }}>
                      {t.total}
                    </td>
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

const input: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '2px solid #e5e7eb',
  borderRadius: '10px',
  fontSize: '14px',
  boxSizing: 'border-box',
  color: '#111827',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
}

const th: React.CSSProperties = {
  padding: '12px',
  textAlign: 'right',
  fontSize: '12px',
}

const td: React.CSSProperties = {
  padding: '11px 12px',
  textAlign: 'right',
  color: '#374151',
}