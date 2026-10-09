'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RevenuesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [branches, setBranches] = useState<any[]>([])
  const [revenues, setRevenues] = useState<any[]>([])

  const [form, setForm] = useState({
    revenue_date: new Date().toISOString().split('T')[0],
    branch_id: '', network_amount: '', cash_amount: '',
    expenses: '', invoices: '', notes: '',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }

    const [br, rev] = await Promise.all([
      supabase.from('branches').select('id, name').eq('is_active', true).order('name'),
      supabase.from('revenues').select(`id, revenue_date, network_amount, cash_amount, expenses, invoices, total_sales, branches(name)`).order('created_at', { ascending: false }).limit(20),
    ])
    setBranches(br.data || [])
    setRevenues(rev.data || [])
    setLoading(false)
  }

  const network = parseFloat(form.network_amount) || 0
  const cash = parseFloat(form.cash_amount) || 0
  const expenses = parseFloat(form.expenses) || 0
  const invoices = parseFloat(form.invoices) || 0
  const totalSales = network + cash - expenses - invoices

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMessage('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase.from('users').select('company_id, id').eq('auth_id', user.id).single()
    if (!userData) { setMessage('❌ لم يتم العثور على بيانات المستخدم'); setSaving(false); return }

    const { error } = await supabase.from('revenues').insert({
      company_id: userData.company_id, branch_id: form.branch_id,
      revenue_date: form.revenue_date,
      network_amount: network, cash_amount: cash,
      expenses, invoices, total_sales: totalSales,
      notes: form.notes || null, created_by: userData.id,
    })

    if (error) { setMessage('❌ خطأ: ' + error.message); setSaving(false); return }
    setMessage('✅ تم حفظ الإيراد بنجاح!')
    setForm({ ...form, network_amount: '', cash_amount: '', expenses: '', invoices: '', notes: '' })
    await loadData()
    setSaving(false)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#059669' }}>جاري التحميل...</div>

  return (
    <div>
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '26px' }}>💰 إدارة الإيرادات</h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>تسجيل الإيرادات اليومية (شبكة، كاش، مصروفات، فواتير)</p>
      </div>

      <div style={{ background: 'white', padding: '25px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '25px' }}>
        <h2 style={{ margin: '0 0 20px', color: '#065f46', fontSize: '17px' }}>➕ إضافة إيراد جديد</h2>

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
            <Field label="التاريخ *">
              <input type="date" value={form.revenue_date} onChange={e => setForm({...form, revenue_date: e.target.value})} required style={input} />
            </Field>
            <Field label="الفرع *">
              <select value={form.branch_id} onChange={e => setForm({...form, branch_id: e.target.value})} required style={input}>
                <option value="">اختر الفرع</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="الشبكة (البنك)">
              <input type="number" step="0.01" value={form.network_amount} onChange={e => setForm({...form, network_amount: e.target.value})} style={input} />
            </Field>
            <Field label="الكاش">
              <input type="number" step="0.01" value={form.cash_amount} onChange={e => setForm({...form, cash_amount: e.target.value})} style={input} />
            </Field>
            <Field label="المصروفات">
              <input type="number" step="0.01" value={form.expenses} onChange={e => setForm({...form, expenses: e.target.value})} style={input} />
            </Field>
            <Field label="الفواتير">
              <input type="number" step="0.01" value={form.invoices} onChange={e => setForm({...form, invoices: e.target.value})} style={input} />
            </Field>
            <Field label="إجمالي المبيعات">
              <input type="text" value={totalSales.toFixed(2)} readOnly style={{...input, background: '#d1fae5', fontWeight: 'bold', color: '#065f46'}} />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="ملاحظات">
                <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={input} />
              </Field>
            </div>
          </div>

          <button type="submit" disabled={saving} style={{
            marginTop: '20px', padding: '14px 40px',
            background: saving ? '#9ca3af' : '#059669', color: 'white',
            border: 'none', borderRadius: '10px', fontSize: '16px',
            fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
          }}>
            {saving ? 'جاري الحفظ...' : '💾 حفظ الإيراد'}
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
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '17px' }}>📋 آخر 20 إيراد</h2>
        {revenues.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>لا توجد إيرادات بعد</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f0fdf4', color: '#065f46' }}>
                  <th style={th}>التاريخ</th>
                  <th style={th}>الفرع</th>
                  <th style={th}>الشبكة</th>
                  <th style={th}>الكاش</th>
                  <th style={th}>المصروفات</th>
                  <th style={th}>الفواتير</th>
                  <th style={th}>إجمالي المبيعات</th>
                </tr>
              </thead>
              <tbody>
                {revenues.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={td}>{r.revenue_date}</td>
                    <td style={td}>{r.branches?.name}</td>
                    <td style={td}>{r.network_amount}</td>
                    <td style={td}>{r.cash_amount}</td>
                    <td style={td}>{r.expenses}</td>
                    <td style={td}>{r.invoices}</td>
                    <td style={{...td, fontWeight: 'bold', color: '#059669'}}>{r.total_sales}</td>
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