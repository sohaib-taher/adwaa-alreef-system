'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const today = new Date().toISOString().slice(0, 10)

export default function DebtsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [debts, setDebts] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')

  const [form, setForm] = useState({
    party_name: 'جابر',
    party_type: 'person',
    branch_id: '',
    debt_date: today,
    amount: '',
    type: 'debit',
    description: '',
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

    const brRes = await supabase
      .from('branches')
      .select('id, name')
      .eq('is_active', true)
      .eq('company_id', cid)
      .order('name')

    const debRes = await supabase
      .from('debts')
      .select('id, party_name, party_type, debt_date, amount, type, description, branches(name)')
      .eq('company_id', cid)
      .order('created_at', { ascending: false })
      .limit(30)

    setBranches(brRes.data || [])
    setDebts(debRes.data || [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
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

    const insertRes = await supabase.from('debts').insert({
      company_id: companyId,
      branch_id: form.branch_id || null,
      party_type: form.party_type,
      party_name: form.party_name,
      debt_date: form.debt_date,
      amount: parseFloat(form.amount) || 0,
      type: form.type,
      description: form.description || null,
      created_by: userInfoRes.data?.id,
    })

    if (insertRes.error) {
      setMessage('خطأ: ' + insertRes.error.message)
      setSaving(false)
      return
    }

    setMessage('تم الحفظ بنجاح')
    setForm({ ...form, amount: '', description: '' })
    await loadData()
    setSaving(false)
  }

  const balances: Record<string, number> = {}
  debts.forEach((d) => {
    if (!balances[d.party_name]) balances[d.party_name] = 0
    if (d.type === 'debit') balances[d.party_name] += Number(d.amount)
    else balances[d.party_name] -= Number(d.amount)
  })

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
          إدارة المديونيات
        </h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>
          متابعة المديونيات والسدادات
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '25px',
        }}
      >
        {Object.entries(balances).map(([name, balance]) => (
          <div
            key={name}
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              borderRight: `4px solid ${balance >= 0 ? '#059669' : '#dc2626'}`,
            }}
          >
            <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '5px' }}>
              {name}
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: balance >= 0 ? '#059669' : '#dc2626',
              }}
            >
              {balance.toFixed(2)} ر.س
            </div>
          </div>
        ))}
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
          إضافة مديونية أو سداد
        </h2>

        <form onSubmit={handleSave}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '15px',
            }}
          >
            <Field label="اسم الشخص">
              <input
                type="text"
                value={form.party_name}
                onChange={(e) => setForm({ ...form, party_name: e.target.value })}
                required
                style={input}
                placeholder="جابر، بلال، عبده راجح..."
              />
            </Field>

            <Field label="النوع">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
                style={input}
              >
                <option value="debit">مديونية</option>
                <option value="credit">سداد</option>
              </select>
            </Field>

            <Field label="الفرع">
              <select
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                style={input}
              >
                <option value="">بدون فرع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="التاريخ">
              <input
                type="date"
                value={form.debt_date}
                onChange={(e) => setForm({ ...form, debt_date: e.target.value })}
                required
                style={input}
              />
            </Field>

            <Field label="المبلغ">
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                style={input}
              />
            </Field>

            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="البيان">
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={input}
                  placeholder="مثال: مشتريات فواكه"
                />
              </Field>
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
            {saving ? 'جاري الحفظ...' : 'حفظ'}
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
          آخر 30 حركة
        </h2>

        {debts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
            لا توجد حركات بعد
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
                  <th style={th}>الشخص</th>
                  <th style={th}>الفرع</th>
                  <th style={th}>النوع</th>
                  <th style={th}>المبلغ</th>
                  <th style={th}>البيان</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={td}>{d.debt_date}</td>
                    <td style={{ ...td, fontWeight: 'bold' }}>{d.party_name}</td>
                    <td style={td}>{d.branches?.name || '-'}</td>
                    <td
                      style={{
                        ...td,
                        color: d.type === 'debit' ? '#dc2626' : '#059669',
                        fontWeight: 'bold',
                      }}
                    >
                      {d.type === 'debit' ? 'مديونية' : 'سداد'}
                    </td>
                    <td style={{ ...td, fontWeight: 'bold' }}>{d.amount}</td>
                    <td style={td}>{d.description || '-'}</td>
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