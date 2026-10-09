'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function UsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }

    const { data } = await supabase
      .from('users')
      .select(`id, full_name, email, phone, is_active, roles(name_ar), branches(name), companies(name)`)
      .order('created_at')

    setUsers(data || [])
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#059669' }}>جاري التحميل...</div>

  return (
    <div>
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '26px' }}>👥 إدارة المستخدمين</h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>قائمة المستخدمين والصلاحيات</p>
      </div>

      <div style={{ background: 'white', padding: '25px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '17px' }}>📋 المستخدمون ({users.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f0fdf4', color: '#065f46' }}>
                <th style={th}>الاسم</th>
                <th style={th}>البريد</th>
                <th style={th}>الجوال</th>
                <th style={th}>الدور</th>
                <th style={th}>الفرع</th>
                <th style={th}>الشركة</th>
                <th style={th}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{...td, fontWeight: 'bold'}}>{u.full_name}</td>
                  <td style={td}>{u.email}</td>
                  <td style={td}>{u.phone || '-'}</td>
                  <td style={td}>{u.roles?.name_ar || '-'}</td>
                  <td style={td}>{u.branches?.name || 'كل الفروع'}</td>
                  <td style={td}>{u.companies?.name || '-'}</td>
                  <td style={td}>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px',
                      background: u.is_active ? '#d1fae5' : '#fee2e2',
                      color: u.is_active ? '#065f46' : '#991b1b', fontWeight: 'bold' }}>
                      {u.is_active ? 'نشط' : 'متوقف'}
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

const th: React.CSSProperties = { padding: '12px', textAlign: 'right', fontSize: '12px' }
const td: React.CSSProperties = { padding: '11px 12px', textAlign: 'right', color: '#374151' }