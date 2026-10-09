'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const MENU: { href: string; label: string; icon: string }[] = [
  { href: '/dashboard', label: 'الرئيسية', icon: '🏠' },
  { href: '/dashboard/purchases', label: 'المشتريات', icon: '🛒' },
  { href: '/dashboard/revenues', label: 'الإيرادات', icon: '💰' },
  { href: '/dashboard/transfers', label: 'التحويلات', icon: '🔄' },
  { href: '/dashboard/debts', label: 'المديونيات', icon: '📋' },
  { href: '/dashboard/reports', label: 'التقارير', icon: '📊' },
  { href: '/dashboard/branches', label: 'الفروع', icon: '🏬' },
  { href: '/dashboard/products', label: 'الأصناف', icon: '📦' },
  { href: '/dashboard/users', label: 'المستخدمون', icon: '👥' },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const result = await supabase.auth.getUser()
      if (!result.data.user) {
        window.location.href = '/'
        return
      }
      setEmail(result.data.user.email || '')
    }
    load()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f3f4f6',
        fontFamily: 'Arial',
      }}
    >
      <aside
        style={{
          width: '260px',
          background: '#065f46',
          color: '#ffffff',
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                background: '#ffffff',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src="/logo.png"
                alt="logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>اضواء الريف</div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>نظام الإدارة</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '15px 10px', flex: 1 }}>
          {MENU.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 15px',
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  marginBottom: '4px',
                  background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                  fontSize: '14px',
                  fontWeight: active ? 'bold' : 'normal',
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div
          style={{
            padding: '15px',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px' }}>
            مسجل الدخول:
          </div>
          <div
            style={{
              fontSize: '12px',
              marginBottom: '10px',
              wordBreak: 'break-all',
            }}
          >
            {email}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px',
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          marginRight: '260px',
          padding: '25px',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
    </div>
  )
}