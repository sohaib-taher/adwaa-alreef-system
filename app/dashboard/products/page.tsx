'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProductsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [companyId, setCompanyId] = useState<string>('')

  const [form, setForm] = useState({
    name: '',
    category_id: '',
    unit: '',
    default_price: '',
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

    const prodRes = await supabase
      .from('products')
      .select('id, name, unit, default_price, is_active, categories(name)')
      .eq('company_id', cid)
      .order('name')

    const catRes = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .eq('company_id', cid)
      .order('name')

    setProducts(prodRes.data || [])
    setCategories(catRes.data || [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.category_id) {
      setMessage('الرجاء اختيار التصنيف')
      return
    }
    setSaving(true)
    setMessage('')

    const supabase = createClient()
    const userRes = await supabase.auth.getUser()
    if (!userRes.data.user) return

   // التحقق من عدم وجود الصنف مسبقاً
const existingRes = await supabase
  .from('products')
  .select('id')
  .eq('company_id', companyId)
  .eq('name', form.name)
  .maybeSingle()

if (existingRes.data) {
  setMessage('هذا الصنف موجود مسبقاً')
  setSaving(false)
  return
}

const insertRes = await supabase.from('products').insert({
  company_id: companyId,
  category_id: form.category_id,
  name: form.name,
  unit: form.unit || null,
  default_price: parseFloat(form.default_price) || 0,
  is_active: true,
})

    if (insertRes.error) {
      setMessage('خطأ: ' + insertRes.error.message)
      setSaving(false)
      return
    }

    setMessage('تم إضافة الصنف بنجاح')
    setForm({ name: '', category_id: '', unit: '', default_price: '' })
    await loadData()
    setSaving(false)
  }

  const filtered = products.filter((p) => p.name.includes(search))

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: '#059669' }}>
        جاري التحميل...
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '26px' }}>
          إدارة الأصناف
        </h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>
          إضافة وتعديل الأصناف ({products.length} صنف)
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
          إضافة صنف جديد
        </h2>

        <form onSubmit={handleSave}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '15px',
            }}
          >
            <Field label="اسم الصنف">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={input}
              />
            </Field>

            <Field label="التصنيف">
              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
                required
                style={input}
              >
                <option value="">اختر التصنيف</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="الوحدة">
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                style={input}
                placeholder="كرتون، كيلو، صحن..."
              />
            </Field>

            <Field label="السعر الافتراضي">
              <input
                type="number"
                step="0.01"
                value={form.default_price}
                onChange={(e) =>
                  setForm({ ...form, default_price: e.target.value })
                }
                style={input}
              />
            </Field>
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
            {saving ? 'جاري الحفظ...' : 'حفظ الصنف'}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
            gap: '15px',
            flexWrap: 'wrap',
          }}
        >
          <h2 style={{ margin: 0, color: '#065f46', fontSize: '17px' }}>
            قائمة الأصناف
          </h2>
          <input
            type="text"
            placeholder="ابحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...input, maxWidth: '250px' }}
          />
        </div>

        <div
          style={{
            overflowX: 'auto',
            maxHeight: '500px',
            overflowY: 'auto',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <thead style={{ position: 'sticky', top: 0 }}>
              <tr style={{ background: '#f0fdf4', color: '#065f46' }}>
                <th style={th}>الاسم</th>
                <th style={th}>التصنيف</th>
                <th style={th}>الوحدة</th>
                <th style={th}>السعر</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ ...td, fontWeight: 'bold' }}>{p.name}</td>
                  <td style={td}>{p.categories?.name || '-'}</td>
                  <td style={td}>{p.unit || '-'}</td>
                  <td style={td}>{p.default_price || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#374151',
        }}
      >
        {label}
      </label>
      {children}
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