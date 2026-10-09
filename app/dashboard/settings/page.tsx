'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }
    setUser(user)

    const { data } = await supabase
      .from('users')
      .select(`full_name, email, phone, roles(name_ar), branches(name), companies(name)`)
      .eq('auth_id', user.id)
      .single()

    setUserInfo(data)
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#059669' }}>جاري التحميل...</div>

  return (
    <div>
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '26px' }}>⚙️ الإعدادات</h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>معلومات الحساب وإعدادات النظام</p>
      </div>

      <div style={{ background: 'white', padding: '25px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 20px', color: '#065f46', fontSize: '17px' }}>👤 معلومات الحساب</h2>
        <InfoRow label="الاسم" value={userInfo?.full_name} />
        <InfoRow label="البريد الإلكتروني" value={userInfo?.email} />
        <InfoRow label="الجوال" value={userInfo?.phone || 'غير محدد'} />
        <InfoRow label="الدور" value={userInfo?.roles?.name_ar} />
        <InfoRow label="الشركة" value={userInfo?.companies?.name} />
        <InfoRow label="الفرع" value={userInfo?.branches?.name || 'كل الفروع'} />
      </div>

      <div style={{ background: 'white', padding: '25px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 20px', color: '#065f46', fontSize: '17px' }}>🎨 إعدادات النظام</h2>
        <InfoRow label="العملة" value="ريال سعودي (SAR)" />
        <InfoRow label="الضريبة" value="15% على الفواكه" />
        <InfoRow label="بداية الأسبوع" value="الإثنين" />
        <InfoRow label="نهاية الأسبوع" value="الأحد" />
        <InfoRow label="اللغة" value="العربية" />
      </div>
    </div>
  )
}

function InfoRow({ label, value }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ color: '#6b7280', fontSize: '14px' }}>{label}</span>
      <span style={{ color: '#111827', fontSize: '14px', fontWeight: 'bold' }}>{value || '-'}</span>
    </div>
  )
}