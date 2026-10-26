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
  const [email, setEmail] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  // إغلاق القائمة عند التنقل
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // جلب الإيميل في الخلفية بدون تعليق
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then((res) => {
      if (res.data.session) setEmail(res.data.session.user.email || '')
    }).catch(() => {})
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      window.location.href = '/' // توجيه إجباري
    }
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Arial' }}>
      
      {/* CSS خالص للتحكم في الشاشات بدون جافاسكربت */}
      <style>{`
        .sidebar-container { 
          position: fixed; top: 0; bottom: 0; right: -280px; width: 260px; 
          background: #065f46; color: white; z-index: 999; 
          transition: right 0.3s ease; overflow-y: auto; 
          display: flex; flex-direction: column; 
        }
        .sidebar-container.open { right: 0; }
        .mobile-header { 
          display: flex; background: #065f46; color: white; 
          padding: 15px 20px; justify-content: space-between; 
          align-items: center; position: sticky; top: 0; z-index: 100; 
        }
        .main-content { 
          padding: 20px; min-height: 100vh; margin-right: 0; transition: margin 0.3s; 
        }
        .overlay { 
          display: none; position: fixed; inset: 0; 
          background: rgba(0,0,0,0.5); z-index: 998; 
        }
        .overlay.open { display: block; }
        
        /* عند الشاشات الكبيرة (لابتوب) */
        @media (min-width: 1024px) {
          .sidebar-container { right: 0 !important; }
          .mobile-header { display: none !important; }
          .main-content { margin-right: 260px !important; }
          .overlay { display: none !important; }
        }
      `}</style>

      {/* شريط الجوال */}
      <header className="mobile-header">
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '24px', padding: '5px 15px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ☰
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 'bold' }}>اضواء الريف</span>
          <img src="/logo.png" alt="logo" style={{ width: '35px', height: '35px', background: 'white', borderRadius: '8px', padding: '2px' }} />
        </div>
      </header>

      {/* خلفية سوداء للجوال */}
      <div className={`overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />

      {/* القائمة الجانبية */}
      <aside className={`sidebar-container ${menuOpen ? 'open' : ''}`}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="logo" style={{ width: '40px', height: '40px', background: 'white', borderRadius: '8px', padding: '2px' }} />
          <div><div style={{ fontWeight: 'bold' }}>اضواء الريف</div><div style={{ fontSize: '10px', opacity: 0.7 }}>نظام الإدارة</div></div>
        </div>

        <nav style={{ padding: '10px', flex: 1 }}>
          {MENU.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              onClick={() => setMenuOpen(false)} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', 
                color: 'white', textDecoration: 'none', borderRadius: '8px', marginBottom: '2px', 
                background: pathname === item.href.split('?')[0] ? 'rgba(255,255,255,0.2)' : 'transparent', 
                fontSize: '14px' 
              }}
            >
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: '12px', marginBottom: '10px', wordBreak: 'break-all' }}>{email || 'جاري التحميل...'}</div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* محتوى الصفحة */}
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}