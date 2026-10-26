'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  title: 'إدارة المديونيات والسدادات',
  subTitle: 'متابعة أرصدة الموردين والمناديب',
  addNew: 'إضافة حركة جديدة (مديونية / سداد)',
  editTitle: 'تعديل الحركة',
  person: 'اسم الشخص / المورد',
  type: 'النوع',
  debit: 'مديونية (عليه)',
  credit: 'سداد (دفع)',
  branch: 'الفرع',
  date: 'التاريخ',
  amount: 'المبلغ',
  description: 'البيان',
  save: 'حفظ الحركة',
  update: 'تحديث الحركة',
  cancel: 'إلغاء',
  last30: 'آخر 30 حركة',
  noData: 'لا توجد حركات مسجلة',
  loading: 'جاري التحميل...',
  success: 'تم الحفظ بنجاح',
  updateSuccess: 'تم التحديث بنجاح',
  deleteSuccess: 'تم الحذف بنجاح',
  confirmDelete: 'هل أنت متأكد من حذف هذه الحركة؟ سيتم تسجيلها في سجل التعديلات.',
  tableDate: 'التاريخ', tablePerson: 'الشخص', tableBranch: 'الفرع', tableType: 'النوع',
  tableAmount: 'المبلغ', tableDesc: 'البيان', actions: 'الإجراءات', edit: 'تعديل', delete: 'حذف',
  balancesTitle: 'ملخص الأرصدة الحالية'
}

function DebtsContent() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  const [debts, setDebts] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    party_name: '', type: 'debit', branch_id: '', debt_date: new Date().toISOString().slice(0, 10),
    amount: '', description: ''
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

    const { data: deb } = await supabase
      .from('debts')
      .select(`id, party_name, type, debt_date, amount, description, branch_id, branches(name)`)
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })
      .limit(30)
    
    setDebts(deb || [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMessage('')
    const supabase = createClient()

    if (!form.party_name || !form.amount) {
      setMessage('الرجاء إدخال اسم الشخص والمبلغ'); setSaving(false); return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: userInfo } = await supabase.from('users').select('id').eq('auth_id', user?.id).single()

    const record = {
      company_id: companyId, branch_id: form.branch_id || null,
      party_type: 'person', party_name: form.party_name,
      debt_date: form.debt_date, amount: parseFloat(form.amount) || 0,
      type: form.type, description: form.description || null, created_by: userInfo?.id
    }

    if (editingId) {
      const oldRecord = debts.find(d => d.id === editingId)
      const { error } = await supabase.from('debts').update(record).eq('id', editingId)
      if (error) { setMessage('خطأ: ' + error.message); setSaving(false); return }
      
      await supabase.from('audit_logs').insert({
        company_id: companyId, user_id: userInfo?.id, action: 'تعديل مديونية', table_name: 'debts',
        record_id: editingId, old_values: oldRecord, new_values: record
      })
      setMessage(T.updateSuccess)
    } else {
      const { data: insertedData, error } = await supabase.from('debts').insert(record).select()
      if (error) { setMessage('خطأ: ' + error.message); setSaving(false); return }
      
      await supabase.from('audit_logs').insert({
        company_id: companyId, user_id: userInfo?.id, action: 'إضافة مديونية', table_name: 'debts',
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
    
    const oldRecord = debts.find(d => d.id === id)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: userInfo } = await supabase.from('users').select('id').eq('auth_id', user?.id).single()

    // الحذف مع طلب التأكد من عدد الصفوف المحذوفة
    const { error, count } = await supabase
      .from('debts')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (error) {
      alert('فشل الحذف! السبب: ' + error.message)
      return
    }

    // إذا كان العدد صفر، يعني أن قاعدة البيانات رفضت الحذف (بسبب الصلاحيات)
    if (count === 0) {
      alert('فشل الحذف! السجل موجود ولكن قاعدة البيانات رفضت الحذف (تأكد من صلاحيات RLS في Supabase).')
      return
    }
    
    // تسجيل الحذف في سجل التدقيق
    await supabase.from('audit_logs').insert({
      company_id: companyId, user_id: userInfo?.id, action: 'حذف مديونية', table_name: 'debts',
      record_id: id, old_values: oldRecord
    })

    setMessage(T.deleteSuccess)
    await loadData()
  }

  const handleEditClick = (row: any) => {
    setEditingId(row.id)
    setForm({
      party_name: row.party_name, type: row.type, branch_id: row.branch_id || '',
      debt_date: row.debt_date, amount: row.amount.toString(), description: row.description || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({ ...form, party_name: '', amount: '', description: '' })
  }

  // حساب الأرصدة لكل شخص
  const balances: Record<string, number> = {}
  debts.forEach(d => {
    if (!balances[d.party_name]) balances[d.party_name] = 0
    if (d.type === 'debit') balances[d.party_name] += Number(d.amount)
    else balances[d.party_name] -= Number(d.amount)
  })

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl' }}>
      
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '24px' }}>{T.title}</h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>{T.subTitle}</p>
      </div>

      {message && (
        <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', background: message.includes('بنجاح') ? '#d1fae5' : '#fee2e2', color: message.includes('بنجاح') ? '#065f46' : '#991b1b', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      {/* ملخص الأرصدة */}
      <h2 style={{ color: '#374151', fontSize: '18px', marginBottom: '10px' }}>{T.balancesTitle}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        {Object.entries(balances).map(([name, balance]) => (
          <div key={name} style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRight: `4px solid ${balance >= 0 ? '#059669' : '#dc2626'}` }}>
            <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '5px' }}>{name}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: balance >= 0 ? '#059669' : '#dc2626' }}>
              {balance.toFixed(2)} ر.س
            </div>
          </div>
        ))}
      </div>

      {/* نموذج الإدخال / التعديل */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px', border: editingId ? '2px solid #3b82f6' : 'none' }}>
        <h2 style={{ margin: '0 0 15px', color: editingId ? '#1d4ed8' : '#065f46', fontSize: '18px' }}>
          {editingId ? T.editTitle : T.addNew}
        </h2>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
            <div>
              <label style={labelStyle}>{T.person}</label>
              <input type="text" value={form.party_name} onChange={e => setForm({...form, party_name: e.target.value})} required style={inputStyle} placeholder="جابر، بلال، الخ..." />
            </div>
            <div>
              <label style={labelStyle}>{T.type}</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} required style={inputStyle}>
                <option value="debit">{T.debit}</option>
                <option value="credit">{T.credit}</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{T.branch}</label>
              <select value={form.branch_id} onChange={e => setForm({...form, branch_id: e.target.value})} style={inputStyle}>
                <option value="">بدون فرع</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>{T.date}</label><input type="date" value={form.debt_date} onChange={e => setForm({...form, debt_date: e.target.value})} required style={inputStyle} /></div>
            <div><label style={labelStyle}>{T.amount}</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required style={inputStyle} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>{T.description}</label><input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={inputStyle} /></div>
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
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '18px' }}>{T.last30}</h2>
        {debts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>{T.noData}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#f0fdf4', color: '#065f46', borderBottom: '2px solid #059669' }}>
                  <th style={thStyle}>{T.tableDate}</th><th style={thStyle}>{T.tablePerson}</th><th style={thStyle}>{T.tableBranch}</th>
                  <th style={thStyle}>{T.tableType}</th><th style={thStyle}>{T.tableAmount}</th><th style={thStyle}>{T.tableDesc}</th>
                  <th style={thStyle}>{T.actions}</th>
                </tr>
              </thead>
              <tbody>
                {debts.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #e5e7eb', background: editingId === d.id ? '#eff6ff' : 'transparent' }}>
                    <td style={tdStyle}>{d.debt_date}</td>
                    <td style={{...tdStyle, fontWeight: 'bold'}}>{d.party_name}</td>
                    <td style={tdStyle}>{(d.branches as any)?.name || '-'}</td>
                    <td style={{...tdStyle, color: d.type === 'debit' ? '#dc2626' : '#059669', fontWeight: 'bold'}}>
                      {d.type === 'debit' ? T.debit : T.credit}
                    </td>
                    <td style={{...tdStyle, fontWeight: 'bold'}}>{d.amount}</td>
                    <td style={tdStyle}>{d.description || '-'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => handleEditClick(d)} style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{T.edit}</button>
                        <button onClick={() => handleDelete(d.id)} style={{ padding: '6px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{T.delete}</button>
                      </div>
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

export default function DebtsPage() {
  return <Suspense fallback={<div>جاري التحميل...</div>}><DebtsContent /></Suspense>
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }
const thStyle: React.CSSProperties = { padding: '12px', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '10px' }