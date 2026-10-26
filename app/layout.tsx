'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const MENU = [
  { href: '/dashboard', label: 'الرئيسية', icon: '🏠' },
  { href: '/dashboard/daily-receipts?type=vegetable', label: 'استلام خضار', icon: '🥬' },
  { href: '/dashboard/daily-receipts?type=fruit', label: 'استلام فواكه', icon: '🍎' },
  { href: '/dashboard/worker-confirm', label: 'تأكيد استلام العمال', icon: '👷‍♂️' },
  { href: '/dashboard/worker-approval', label: 'اعتماد الإدارة', icon: '✅' },
  { href: '/dashboard/revenues', label: 'الإيرادات اليومية', icon: '💰' },
  { href: '/dashboard/debts', label: 'المديونيات', icon: '📋' },
  { href: '/dashboard/reports/weekly', label: 'التقرير الأسبوعي', icon: '📊' },
  { href: '/dashboard/reports/jaber', label: 'تقرير جابر', icon: '👨‍💼' },
  { href: '/dashboard/reports/bilal', label: 'تقرير بلال', icon: '🚚' },
  { href: '/dashboard/reports/rajeh', label: 'تقرير راجح', icon: '📦' },
  { href: '/dashboard/users', label: 'المستخدمون', icon: '👥' },
  { href: '/dashboard/audit-logs', label: 'سجل التعديلات', icon: '📜' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Arial' }}>
      
      <style>{`
        .sidebar { width: 260px; background: #065f46; color: white; position: fixed; top: 0; bottom: 0; right: 0; overflow-y: auto; z-index: 1000; display: flex; flex-direction: column; }
        .main-area { flex: 1; padding: 20px; margin-right: 260px; width: calc(100% - 260px); }
        @media (max-width: 1023px) {
          .sidebar { position: static; width: 100%; height: auto; }
          .main-area { margin-right: 0; width: 100%; padding: 10px; }
        }
      `}</style>

      <aside className="sidebar">
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <img src="/logo.png" alt="logo" style={{ width: '60px', height: '60px', background: 'white', borderRadius: '10px', padding: '5px', marginBottom: '10px' }} />
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>اضواء الريف</div>
        </div>
        
        <nav style={{ padding: '10px', flex: 1 }}>
          {MENU.map((item) => (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', color: 'white', textDecoration: 'none', borderRadius: '8px', marginBottom: '4px' }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <form action="/auth/signout" method="post">
            <button type="submit" style={{ width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>
              تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>

      <main className="main-area">
        {children}
      </main>
    </div>
  )
}