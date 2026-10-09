'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BranchesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [branches, setBranches] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])

  const [form, setForm] = useState({ name: '', code: '', company_id: '', phone: '', address: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }

    const [br, comp] = await Promise.all([
      supabase.from('branches').select('id, name, code, phone, address, is_active, companies(name)').order('created_at'),
      supabase.from('companies').select('id, name').eq('is_active', true),
    ])
    setBranches(br.data || [])
    setCompanies(comp.data || [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company_id) { setMessage('❌ اختر الشركة'); return }
    setSaving(true); setMessage('')
    const supabase = createClient()

    const { error } = await supabase.from('branches').insert({
      company_id: form.company_id, name: form.name,
      code: form.code || null, phone: form.phone || null,
      address: form.address || null, is_active: true,
    })

    if (error) { setMessage('❌ خطأ: ' + error.message); setSaving(false); return }
    setMessage('✅ تم إضافة الفرع بنجاح!')
    setForm({ name: '', code: '', company_id: '', phone: '', address: '' })
    await loadData()
    setSaving(false)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#059669' }}>جاري التحميل...</div>

  return (
    <div>
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '26px' }}>🏬 إدارة الفروع</h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>إضافة وتعديل الفروع</p>
      </div>

      <div style={{ background: 'white', padding: '25px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '25px' }}>
        <h2 style={{ margin: '0 0 20px', color: '#065f46', fontSize: '17px' }}>➕ إضافة فرع جديد</h2>

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
            <Field label="الشركة *">
              <select value={form.company_id} onChange={e => setForm({...form, company_id: e.target.value})} required style={input}>
                <option value="">اختر الشركة</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="اسم الفرع *">
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={input} />
            </Field>
            <Field label="كود الفرع">
              <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} style={input} placeholder="BR-001" />
            </Field>
            <Field label="الجوال">
              <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={input} />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="العنوان">
                <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={input} />
              </Field>
            </div>
          </div>

          <button type="submit" disabled={saving} style={{
            marginTop: '20px', padding: '14px 40px',
            background: saving ? '#9ca3af' : '#059669', color: 'white',
            border: 'none', borderRadius: '10px', fontSize: '16px',
            fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
          }}>
            {saving ? 'جاري الحفظ...' : '💾 حفظ الفرع'}
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

      <div style={{ background: 'white', padding: '25px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '17px' }}>📋 قائمة الفروع ({branches.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f0fdf4', color: '#065f46' }}>
                <th style={th}>الكود</th>
                <th style={th}>الاسم</th>
                <th style={th}>الشركة</th>
                <th style={th}>الجوال</th>
                <th style={th}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={td}>{b.code || '-'}</td>
                  <td style={{...td, fontWeight: 'bold'}}>{b.name}</td>
                  <td style={td}>{b.companies?.name}</td>
                  <td style={td}>{b.phone || '-'}</td>
                  <td style={td}>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px',
                      background: b.is_active ? '#d1fae5' : '#fee2e2',
                      color: b.is_active ? '#065f46' : '#991b1b', fontWeight: 'bold' }}>
                      {b.is_active ? 'نشط' : 'متوقف'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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