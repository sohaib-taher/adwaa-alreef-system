'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'

const T = {
  title: 'إدارة الإيرادات اليومية',
  subTitle: 'تسجيل ومتابعة الإيرادات (شبكة، كاش، مصروفات، فواتير)',
  addNew: 'إضافة إيراد جديد',
  editTitle: 'تعديل الإيراد',
  print: '🖨️ طباعة',
  export: '📥 تصدير Excel',
  date: 'التاريخ',
  branch: 'الفرع',
  network: 'الشبكة (البنك)',
  cash: 'الكاش',
  expenses: 'المصروفات',
  invoices: 'الفواتير',
  totalSales: 'صافي المبيعات',
  notes: 'ملاحظات',
  save: 'حفظ الإيراد',
  update: 'تحديث الإيراد',
  cancel: 'إلغاء',
  last20: 'آخر 20 إيراد',
  loading: 'جاري التحميل...',
  success: 'تم الحفظ بنجاح!',
  updateSuccess: 'تم التحديث بنجاح!',
  deleteSuccess: 'تم الحذف بنجاح!',
  errorDuplicate: 'يوجد إيراد مسجل لهذا الفرع في هذا التاريخ مسبقاً!',
  confirmDelete: 'هل أنت متأكد من حذف هذا الإيراد؟ (سيتم تسجيل العملية في سجل التعديلات)',
  noData: 'لا توجد إيرادات مسجلة',
  tableDate: 'التاريخ', tableBranch: 'الفرع', tableNetwork: 'الشبكة', tableCash: 'الكاش',
  tableExpenses: 'المصروفات', tableInvoices: 'الفواتير', tableTotal: 'الصافي',
  actions: 'الإجراءات', edit: 'تعديل', delete: 'حذف'
}

function RevenuesContent() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  const [branches, setBranches] = useState<any[]>([])
  const [revenues, setRevenues] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    revenue_date: new Date().toISOString().slice(0, 10),
    branch_id: '', network_amount: '', cash_amount: '', expenses: '', invoices: '', notes: '',
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

    const { data: rev } = await supabase
      .from('revenues')
      .select(`id, revenue_date, network_amount, cash_amount, expenses, invoices, total_sales, notes, branch_id, branches(name)`)
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
  
  // المعادلة المحاسبية الصحيحة: (الشبكة + الكاش) - (المصروفات + الفواتير)
  const totalSales = (network + cash) - (expenses + invoices)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMessage('')
    const supabase = createClient()

    if (!form.branch_id) {
      setMessage('الرجاء اختيار الفرع'); setSaving(false); return
    }

    // التحقق من التكرار (نفس الفرع ونفس التاريخ)
    let duplicateQuery = supabase.from('revenues').select('id').eq('company_id', companyId).eq('branch_id', form.branch_id).eq('revenue_date', form.revenue_date)
    if (editingId) duplicateQuery = duplicateQuery.neq('id', editingId)
    
    const { data: existing } = await duplicateQuery.maybeSingle()
    if (existing) { setMessage(T.errorDuplicate); setSaving(false); return }

    // جلب بيانات المستخدم لتسجيلها في سجل التدقيق
    const { data: { user } } = await supabase.auth.getUser()
    const { data: userInfo } = await supabase.from('users').select('id, full_name').eq('auth_id', user?.id).single()

    const record = {
      company_id: companyId, branch_id: form.branch_id, revenue_date: form.revenue_date,
      network_amount: network, cash_amount: cash, expenses: expenses, invoices: invoices,
      total_sales: totalSales, notes: form.notes || null, created_by: userInfo?.id
    }

    if (editingId) {
      // 1. جلب القيمة القديمة قبل التعديل
      const oldRecord = revenues.find(r => r.id === editingId)
      
      // 2. تحديث السجل
      const { error } = await supabase.from('revenues').update(record).eq('id', editingId)
      if (error) { setMessage('خطأ: ' + error.message); setSaving(false); return }
      
      // 3. تسجيل التعديل في سجل التدقيق
      await supabase.from('audit_logs').insert({
        company_id: companyId, user_id: userInfo?.id, action: 'تعديل إيراد', table_name: 'revenues',
        record_id: editingId, old_values: oldRecord, new_values: record
      })
      setMessage(T.updateSuccess)
    } else {
      // 1. إضافة السجل الجديد وجلب رقمه
      const { data: insertedData, error } = await supabase.from('revenues').insert(record).select()
      if (error) { setMessage('خطأ: ' + error.message); setSaving(false); return }
      
      // 2. تسجيل الإضافة في سجل التدقيق
      await supabase.from('audit_logs').insert({
        company_id: companyId, user_id: userInfo?.id, action: 'إضافة إيراد جديد', table_name: 'revenues',
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
    
    // جلب السجل قبل حذفه
    const oldRecord = revenues.find(r => r.id === id)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: userInfo } = await supabase.from('users').select('id').eq('auth_id', user?.id).single()

    try {
      // تنفيذ الحذف
      const { error, count } = await supabase
        .from('revenues')
        .delete({ count: 'exact' })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      if (count === 0) {
        throw new Error('لم يتم العثور على السجل أو لا تملك صلاحية لحذفه.')
      }
      
      // تسجيل الحذف في سجل التدقيق (يحدث بعد نجاح الحذف)
      await supabase.from('audit_logs').insert({
        company_id: companyId, user_id: userInfo?.id, action: 'حذف إيراد', table_name: 'revenues',
        record_id: id, old_values: oldRecord
      })

      setMessage(T.deleteSuccess)
      await loadData() // تحديث الجدول

    } catch (err: any) {
      // إذا فشل الحذف، سيظهر لك السبب الدقيق هنا
      alert('فشل الحذف من قاعدة البيانات! السبب: ' + err.message)
      console.error('Delete Error:', err)
    }
  }

  const handleEditClick = (row: any) => {
    setEditingId(row.id)
    setForm({
      revenue_date: row.revenue_date, branch_id: row.branch_id,
      network_amount: row.network_amount.toString(), cash_amount: row.cash_amount.toString(),
      expenses: row.expenses.toString(), invoices: row.invoices.toString(), notes: row.notes || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({ ...form, network_amount: '', cash_amount: '', expenses: '', invoices: '', notes: '' })
  }

  const handleExport = () => {
    const excelData = revenues.map(r => ({
      'التاريخ': r.revenue_date,
      'الفرع': (r.branches as any)?.name || '',
      'الشبكة': r.network_amount,
      'الكاش': r.cash_amount,
      'المصروفات': r.expenses,
      'الفواتير': r.invoices,
      'صافي المبيعات': r.total_sales
    }))
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "الإيرادات اليومية")
    XLSX.writeFile(wb, `الإيرادات_اليومية_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#059669' }}>{T.loading}</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl' }}>
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#065f46', fontSize: '24px' }}>{T.title}</h1>
          <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>{T.subTitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} style={btnStyle('#059669')}>{T.print}</button>
          <button onClick={handleExport} style={btnStyle('#2563eb')}>{T.export}</button>
        </div>
      </div>

      {message && (
        <div className="no-print" style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', background: message.includes('بنجاح') ? '#d1fae5' : '#fee2e2', color: message.includes('بنجاح') ? '#065f46' : '#991b1b', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      {/* نموذج الإدخال / التعديل */}
      <div className="no-print" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px', border: editingId ? '2px solid #3b82f6' : 'none' }}>
        <h2 style={{ margin: '0 0 15px', color: editingId ? '#1d4ed8' : '#065f46', fontSize: '18px' }}>
          {editingId ? T.editTitle : T.addNew}
        </h2>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
            <div><label style={labelStyle}>{T.date}</label><input type="date" value={form.revenue_date} onChange={e => setForm({...form, revenue_date: e.target.value})} required style={inputStyle} /></div>
            <div><label style={labelStyle}>{T.branch}</label>
              <select value={form.branch_id} onChange={e => setForm({...form, branch_id: e.target.value})} required style={inputStyle}>
                <option value="">اختر الفرع</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>{T.network}</label><input type="number" step="0.01" value={form.network_amount} onChange={e => setForm({...form, network_amount: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>{T.cash}</label><input type="number" step="0.01" value={form.cash_amount} onChange={e => setForm({...form, cash_amount: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>{T.expenses}</label><input type="number" step="0.01" value={form.expenses} onChange={e => setForm({...form, expenses: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>{T.invoices}</label><input type="number" step="0.01" value={form.invoices} onChange={e => setForm({...form, invoices: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>{T.totalSales}</label><input type="text" value={totalSales.toFixed(2)} readOnly style={{...inputStyle, background: '#dcfce7', fontWeight: 'bold', color: '#065f46'}} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>{T.notes}</label><input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={inputStyle} /></div>
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
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '18px' }}>{T.last20}</h2>
        {revenues.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>{T.noData}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#f0fdf4', color: '#065f46', borderBottom: '2px solid #059669' }}>
                  <th style={thStyle}>{T.tableDate}</th><th style={thStyle}>{T.tableBranch}</th><th style={thStyle}>{T.tableNetwork}</th>
                  <th style={thStyle}>{T.tableCash}</th><th style={thStyle}>{T.tableExpenses}</th><th style={thStyle}>{T.tableInvoices}</th>
                  <th style={thStyle}>{T.tableTotal}</th><th className="no-print" style={thStyle}>{T.actions}</th>
                </tr>
              </thead>
              <tbody>
                {revenues.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #e5e7eb', background: editingId === r.id ? '#eff6ff' : 'transparent' }}>
                    <td style={tdStyle}>{r.revenue_date}</td>
                    <td style={tdStyle}>{(r.branches as any)?.name}</td>
                    <td style={tdStyle}>{r.network_amount}</td>
                    <td style={tdStyle}>{r.cash_amount}</td>
                    <td style={tdStyle}>{r.expenses}</td>
                    <td style={tdStyle}>{r.invoices}</td>
                    <td style={{...tdStyle, fontWeight: 'bold', color: '#059669'}}>{r.total_sales}</td>
                    <td className="no-print" style={tdStyle}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => handleEditClick(r)} style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{T.edit}</button>
                        <button onClick={() => handleDelete(r.id)} style={{ padding: '6px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{T.delete}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* تنسيقات الطباعة */}
      <style jsx global>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          body { background: white !important; }
          table { font-size: 11px !important; }
        }
      `}</style>
    </div>
  )
}

export default function RevenuesPage() {
  return <Suspense fallback={<div>جاري التحميل...</div>}><RevenuesContent /></Suspense>
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }
const thStyle: React.CSSProperties = { padding: '12px', fontWeight: 'bold' }
const tdStyle: React.CSSProperties = { padding: '10px' }
const btnStyle = (bg: string): React.CSSProperties => ({ padding: '10px 20px', background: bg, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' })