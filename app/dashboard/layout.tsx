'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false) // إغلاق القائمة عند التنقل
  }, [pathname])

  // تسجيل خروج فوري
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.replace('/')
  }

  return (
    <div dir="rtl" className="dashboard-container">
      {/* ستايل مغلق لا يعتمد على الجافاسكربت لمنع الوميض */}
      <style>{`
        .dashboard-container { display: flex; min-height: 100vh; background: #f3f4f6; font-family: Arial; }
        .sidebar { width: 260px; background: #065f46; color: white; position: fixed; top: 0; bottom: 0; right: 0; overflow-y: auto; z-index: 1000; display: flex; flex-direction: column; transition: transform 0.3s; }
        .main-area { flex: 1; padding: 20px; margin-right: 260px; }
        .mobile-bar { display: none; background: #065f46; color: white; padding: 15px; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1001; }
        
        @media (max-width: 1023px) {
          .sidebar { transform: translateX(100%); }
          .sidebar.open { transform: translateX(0); }
          .main-area { margin-right: 0; }
          .mobile-bar { display: flex; }
        }
      `}</style>

      {/* شريط الجوال */}
      <header className="mobile-bar">
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px' }}>☰</button>
        <span style={{ fontWeight: 'bold' }}>اضواء الريف</span>
      </header>

      {/* القائمة الجانبية */}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <img src="/logo.png" alt="logo" style={{ width: '60px', height: '60px', background: 'white', borderRadius: '10px', padding: '5px', marginBottom: '10px' }} />
          <div style={{ fontWeight: 'bold' }}>اضواء الريف</div>
        </div>

        <nav style={{ padding: '10px', flex: 1 }}>
          {MENU.map((item) => (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', color: 'white', textDecoration: 'none', borderRadius: '8px', marginBottom: '4px', background: pathname === item.href.split('?')[0] ? 'rgba(255,255,255,0.2)' : 'transparent' }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>تسجيل الخروج</button>
        </div>
      </aside>

      {/* محتوى الصفحة */}
      <main className="main-area">
        {children}
      </main>
    </div>
  )
}