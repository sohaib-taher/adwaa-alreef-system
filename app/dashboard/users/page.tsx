'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  title: 'إدارة المستخدمين والصلاحيات',
  addNew: 'إضافة مستخدم جديد',
  editTitle: 'تعديل بيانات المستخدم',
  name: 'الاسم الكامل',
  email: 'البريد الإلكتروني',
  password: 'كلمة المرور',
  newPassword: '(اتركه فارغاً إذا لم ترد تغييره)',
  role: 'الدور / الصلاحية',
  branch: 'الفرع المسموح',
  allBranches: 'كل الفروع',
  save: 'إنشاء الحساب',
  update: 'تحديث البيانات',
  cancel: 'إلغاء',
  last: 'قائمة المستخدمين',
  loading: 'جاري التحميل...',
  success: 'تم إنشاء الحساب بنجاح!',
  updateSuccess: 'تم التحديث بنجاح!',
  deleteSuccess: 'تم حذف المستخدم بنجاح!',
  confirmDelete: 'هل أنت متأكد من حذف هذا المستخدم نهائياً؟ لا يمكن التراجع.',
  error: 'حدث خطأ',
  tableName: 'الاسم', tableEmail: 'البريد', tableRole: 'الصلاحية', tableBranch: 'الفرع', tableStatus: 'الحالة', tableActions: 'الإجراءات',
  statusActive: 'نشط', statusInactive: 'موقوف', edit: 'تعديل', delete: 'حذف'
}

function UsersContent() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [adminId, setAdminId] = useState('')
  
  const [editingUser, setEditingUser] = useState<any>(null)

  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role_id: '', branch_id: ''
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase.from('users').select('id, company_id').eq('auth_id', user.id).single()
    if (!userData) return
    setCompanyId(userData.company_id)
    setAdminId(userData.id)

    const { data: rl } = await supabase.from('roles').select('id, name_ar').eq('company_id', userData.company_id)
    setRoles(rl || [])

    const { data: br } = await supabase.from('branches').select('id, name').eq('is_active', true).eq('company_id', userData.company_id)
    setBranches(br || [])

    const { data: usr } = await supabase
      .from('users')
      .select(`id, auth_id, full_name, email, is_active, role_id, branch_id, roles(name_ar), branches(name)`)
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })
    
    setUsers(usr || [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMessage('')
    
    if (!form.role_id) { setMessage('الرجاء اختيار صلاحية'); setSaving(false); return }
    if (!editingUser && form.password.length < 6) { setMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); setSaving(false); return }

    try {
      const isEditing = !!editingUser
      const endpoint = isEditing ? '/api/manage-user' : '/api/create-user'
      
      const payload = isEditing ? {
        action: 'update',
        auth_id: editingUser.auth_id,
        public_id: editingUser.id,
        company_id: companyId,
        admin_id: adminId,
        full_name: form.full_name,
        email: form.email !== editingUser.email ? form.email : undefined, // نرسل البريد فقط إذا تغير
        password: form.password ? form.password : undefined, // نرسل كلمة المرور فقط إذا كتبها
        role_id: form.role_id,
        branch_id: form.branch_id,
      } : {
        ...form,
        company_id: companyId
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ')

      setMessage(isEditing ? T.updateSuccess : T.success)
      resetForm()
      await loadData()
    } catch (err: any) {
      setMessage(T.error + ': ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(u: any) {
    if (!window.confirm(T.confirmDelete)) return
    setSaving(true)
    
    try {
      const res = await fetch('/api/manage-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete', auth_id: u.auth_id, public_id: u.id, company_id: companyId, admin_id: adminId
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setMessage(T.deleteSuccess)
      await loadData()
    } catch (err: any) {
      alert(T.error + ': ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (u: any) => {
    setEditingUser(u)
    setForm({
      full_name: u.full_name, email: u.email, password: '', role_id: u.role_id, branch_id: u.branch_id || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingUser(null)
    setForm({ full_name: '', email: '', password: '', role_id: '', branch_id: '' })
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

      {/* نموذج الإدخال / التعديل */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px', border: editingUser ? '2px solid #3b82f6' : 'none' }}>
        <h2 style={{ margin: '0 0 15px', color: editingUser ? '#1d4ed8' : '#065f46', fontSize: '18px' }}>
          {editingUser ? T.editTitle : T.addNew}
        </h2>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div><label style={labelStyle}>{T.name}</label><input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required style={inputStyle} /></div>
            <div><label style={labelStyle}>{T.email}</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>{T.password} {editingUser && <span style={{color: '#6b7280', fontWeight: 'normal'}}>{T.newPassword}</span>}</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editingUser} style={inputStyle} placeholder={editingUser ? "********" : ""} />
            </div>
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
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={saving} style={{ padding: '12px 30px', background: saving ? '#9ca3af' : (editingUser ? '#3b82f6' : '#059669'), color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px', fontFamily: 'inherit' }}>
              {saving ? 'جاري الحفظ...' : (editingUser ? T.update : T.save)}
            </button>
            {editingUser && (
              <button type="button" onClick={resetForm} style={{ padding: '12px 20px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {T.cancel}
              </button>
            )}
          </div>
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
                <th style={thStyle}>{T.tableActions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb', background: editingUser?.id === u.id ? '#eff6ff' : 'transparent' }}>
                  <td style={{...tdStyle, fontWeight: 'bold'}}>{u.full_name}</td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>{(u.roles as any)?.name_ar || '-'}</td>
                  <td style={tdStyle}>{(u.branches as any)?.name || T.allBranches}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', background: u.is_active ? '#dcfce7' : '#fee2e2', color: u.is_active ? '#065f46' : '#991b1b', fontWeight: 'bold' }}>
                      {u.is_active ? T.statusActive : T.statusInactive}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                      <button onClick={() => handleEditClick(u)} style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{T.edit}</button>
                      <button onClick={() => handleDelete(u)} style={{ padding: '6px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{T.delete}</button>
                    </div>
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