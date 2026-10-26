'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  title: 'إدارة المستخدمين والصلاحيات',
  addNew: 'إضافة مستخدم جديد',
  name: 'الاسم الكامل',
  email: 'البريد الإلكتروني',
  password: 'كلمة المرور المؤقتة',
  role: 'الدور / الصلاحية',
  branch: 'الفرع المسموح',
  allBranches: 'كل الفروع',
  save: 'إنشاء الحساب',
  last: 'قائمة المستخدمين',
  loading: 'جاري التحميل...',
  success: 'تم إنشاء الحساب بنجاح!',
  error: 'حدث خطأ',
  noData: 'لا يوجد مستخدمون',
  tableName: 'الاسم', tableEmail: 'البريد', tableRole: 'الصلاحية', tableBranch: 'الفرع', tableStatus: 'الحالة',
  statusActive: 'نشط', statusInactive: 'موقوف'
}

function UsersContent() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')

  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role_id: '', branch_id: ''
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase.from('users').select('company_id').eq('auth_id', user.id).single()
    if (!userData) return
    setCompanyId(userData.company_id)

    const { data: rl } = await supabase.from('roles').select('id, name_ar').eq('company_id', userData.company_id)
    setRoles(rl || [])

    const { data: br } = await supabase.from('branches').select('id, name').eq('is_active', true).eq('company_id', userData.company_id)
    setBranches(br || [])

    const { data: usr } = await supabase
      .from('users')
      .select(`id, full_name, email, is_active, roles(name_ar), branches(name)`)
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })
    
    setUsers(usr || [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMessage('')
    
    if (!form.role_id) { setMessage('الرجاء اختيار صلاحية'); setSaving(false); return }
    if (form.password.length < 6) { setMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); setSaving(false); return }

    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          company_id: companyId
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الإنشاء')

      setMessage(T.success)
      setForm({ full_name: '', email: '', password: '', role_id: '', branch_id: '' })
      await loadData()
    } catch (err: any) {
      setMessage(T.error + ': ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl' }}>
      
      <h1 style={{ margin: 0, color: '#065f46', fontSize: '24px', marginBottom: '20px' }}>{T.title}</h1>

      {message && (
        <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', background: message.includes('بنجاح') ? '#d1fae5' : '#fee2e2', color: message.includes('بنجاح') ? '#065f46' : '#991b1b', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      {/* نموذج الإدخال */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px' }}>
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '18px' }}>{T.addNew}</h2>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div><label style={labelStyle}>{T.name}</label><input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required style={inputStyle} /></div>
            <div><label style={labelStyle}>{T.email}</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required style={inputStyle} /></div>
            <div><label style={labelStyle}>{T.password}</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>{T.role}</label>
              <select value={form.role_id} onChange={e => setForm({...form, role_id: e.target.value})} required style={inputStyle}>
                <option value="">اختر الصلاحية</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name_ar}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{T.branch}</label>
              <select value={form.branch_id} onChange={e => setForm({...form, branch_id: e.target.value})} style={inputStyle}>
                <option value="">{T.allBranches}</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ marginTop: '20px', padding: '12px 30px', background: saving ? '#9ca3af' : '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px', fontFamily: 'inherit' }}>
            {saving ? 'جاري الإنشاء...' : T.save}
          </button>
        </form>
      </div>

      {/* جدول العرض */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '18px' }}>{T.last}</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
            <thead>
              <tr style={{ background: '#f0fdf4', color: '#065f46', borderBottom: '2px solid #059669' }}>
                <th style={thStyle}>{T.tableName}</th>
                <th style={thStyle}>{T.tableEmail}</th>
                <th style={thStyle}>{T.tableRole}</th>
                <th style={thStyle}>{T.tableBranch}</th>
                <th style={thStyle}>{T.tableStatus}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{...tdStyle, fontWeight: 'bold'}}>{u.full_name}</td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>{(u.roles as any)?.name_ar || '-'}</td>
                  <td style={tdStyle}>{(u.branches as any)?.name || T.allBranches}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', background: u.is_active ? '#dcfce7' : '#fee2e2', color: u.is_active ? '#065f46' : '#991b1b', fontWeight: 'bold' }}>
                      {u.is_active ? T.statusActive : T.statusInactive}
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

export default function UsersPage() {
  return <Suspense fallback={<div>جاري التحميل...</div>}><UsersContent /></Suspense>
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }
const thStyle: React.CSSProperties = { padding: '12px', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '10px' }