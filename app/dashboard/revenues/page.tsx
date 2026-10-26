'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

const T = {
  title: 'إدارة الإيرادات اليومية',
  subTitle: 'تسجيل الإيرادات اليومية (شبكة، كاش، مصروفات، فواتير)',
  addNew: 'إضافة إيراد جديد',
  date: 'التاريخ',
  branch: 'الفرع',
  network: 'الشبكة (البنك)',
  cash: 'الكاش',
  expenses: 'المصروفات',
  invoices: 'الفواتير',
  totalSales: 'إجمالي المبيعات',
  notes: 'ملاحظات',
  save: 'حفظ الإيراد',
  last20: 'آخر 20 إيراد',
  loading: 'جاري التحميل...',
  success: 'تم حفظ الإيراد بنجاح!',
  errorDuplicate: 'يوجد إيراد مسجل لهذا الفرع في هذا التاريخ مسبقاً!',
  noData: 'لا توجد إيرادات مسجلة',
  tableDate: 'التاريخ',
  tableBranch: 'الفرع',
  tableNetwork: 'الشبكة',
  tableCash: 'الكاش',
  tableExpenses: 'المصروفات',
  tableInvoices: 'الفواتير',
  tableTotal: 'إجمالي المبيعات'
}

function RevenuesContent() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  const [branches, setBranches] = useState<any[]>([])
  const [revenues, setRevenues] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')

  const [form, setForm] = useState({
    revenue_date: new Date().toISOString().slice(0, 10),
    branch_id: '',
    network_amount: '',
    cash_amount: '',
    expenses: '',
    invoices: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase.from('users').select('company_id').eq('auth_id', user.id).single()
    if (!userData) return
    setCompanyId(userData.company_id)

    const { data: br } = await supabase.from('branches').select('id, name').eq('is_active', true).eq('company_id', userData.company_id).order('name')
    setBranches(br || [])

    const { data: rev } = await supabase
      .from('revenues')
      .select(`id, revenue_date, network_amount, cash_amount, expenses, invoices, total_sales, branches(name)`)
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setRevenues(rev || [])
    setLoading(false)
  }

  const network = parseFloat(form.network_amount) || 0
  const cash = parseFloat(form.cash_amount) || 0
  const expenses = parseFloat(form.expenses) || 0
  const invoices = parseFloat(form.invoices) || 0
  const totalSales = network + cash // إجمالي المبيعات = شبكة + كاش

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const supabase = createClient()

    if (!form.branch_id) {
      setMessage('الرجاء اختيار الفرع')
      setSaving(false)
      return
    }

    // التحقق من التكرار (نفس الفرع ونفس التاريخ)
    const { data: existing } = await supabase
      .from('revenues')
      .select('id')
      .eq('company_id', companyId)
      .eq('branch_id', form.branch_id)
      .eq('revenue_date', form.revenue_date)
      .maybeSingle()

    if (existing) {
      setMessage(T.errorDuplicate)
      setSaving(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('revenues').insert({
      company_id: companyId,
      branch_id: form.branch_id,
      revenue_date: form.revenue_date,
      network_amount: network,
      cash_amount: cash,
      expenses: expenses,
      invoices: invoices,
      total_sales: totalSales,
      notes: form.notes || null,
      created_by: user?.id
    })

    if (error) {
      setMessage('حدث خطأ: ' + error.message)
      setSaving(false)
      return
    }

    setMessage(T.success)
    setForm({ ...form, network_amount: '', cash_amount: '', expenses: '', invoices: '', notes: '' })
    await loadData()
    setSaving(false)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#059669' }}>{T.loading}</div>

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

      {/* نموذج الإدخال */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px' }}>
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '18px' }}>{T.addNew}</h2>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
            <div>
              <label style={labelStyle}>{T.date}</label>
              <input type="date" value={form.revenue_date} onChange={e => setForm({...form, revenue_date: e.target.value})} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{T.branch}</label>
              <select value={form.branch_id} onChange={e => setForm({...form, branch_id: e.target.value})} required style={inputStyle}>
                <option value="">اختر الفرع</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{T.network}</label>
              <input type="number" step="0.01" value={form.network_amount} onChange={e => setForm({...form, network_amount: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{T.cash}</label>
              <input type="number" step="0.01" value={form.cash_amount} onChange={e => setForm({...form, cash_amount: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{T.expenses}</label>
              <input type="number" step="0.01" value={form.expenses} onChange={e => setForm({...form, expenses: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{T.invoices}</label>
              <input type="number" step="0.01" value={form.invoices} onChange={e => setForm({...form, invoices: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{T.totalSales}</label>
              <input type="text" value={totalSales.toFixed(2)} readOnly style={{...inputStyle, background: '#dcfce7', fontWeight: 'bold', color: '#065f46'}} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{T.notes}</label>
              <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={inputStyle} />
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ marginTop: '20px', padding: '12px 30px', background: saving ? '#9ca3af' : '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            {saving ? 'جاري الحفظ...' : T.save}
          </button>
        </form>
      </div>

      {/* جدول العرض */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '18px' }}>{T.last20}</h2>
        {revenues.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>{T.noData}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#f0fdf4', color: '#065f46', borderBottom: '2px solid #059669' }}>
                  <th style={thStyle}>{T.tableDate}</th>
                  <th style={thStyle}>{T.tableBranch}</th>
                  <th style={thStyle}>{T.tableNetwork}</th>
                  <th style={thStyle}>{T.tableCash}</th>
                  <th style={thStyle}>{T.tableExpenses}</th>
                  <th style={thStyle}>{T.tableInvoices}</th>
                  <th style={thStyle}>{T.tableTotal}</th>
                </tr>
              </thead>
              <tbody>
                {revenues.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>{r.revenue_date}</td>
                    <td style={tdStyle}>{r.branches?.name}</td>
                    <td style={tdStyle}>{r.network_amount}</td>
                    <td style={tdStyle}>{r.cash_amount}</td>
                    <td style={tdStyle}>{r.expenses}</td>
                    <td style={tdStyle}>{r.invoices}</td>
                    <td style={{...tdStyle, fontWeight: 'bold', color: '#059669'}}>{r.total_sales}</td>
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

export default function RevenuesPage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <RevenuesContent />
    </Suspense>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }
const thStyle: React.CSSProperties = { padding: '12px', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '10px' }