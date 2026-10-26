'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const MENU = [
  { href: '/dashboard', label: 'الرئيسية', icon: '🏠' },
  { href: '/dashboard/daily-receipts?type=vegetable', label: 'استلام خضار', icon: '🥬' },
  { href: '/dashboard/daily-receipts?type=fruit', label: 'استلام فواكه', icon: '🍎' },
  { href: '/dashboard/daily-receipts?type=paper', label: 'استلام ورقيات', icon: '📄' },
  { href: '/dashboard/worker-confirm', label: 'تأكيد استلام العمال', icon: '👷‍♂️' },
  { href: '/dashboard/worker-approval', label: 'اعتماد الإدارة', icon: '✅' },
  { href: '/dashboard/revenues', label: 'الإيرادات اليومية', icon: '💰' },
  { href: '/dashboard/transfers', label: 'التحويلات', icon: '🔄' },
  { href: '/dashboard/debts', label: 'المديونيات', icon: '📋' },
  { href: '/dashboard/purchases', label: 'فواتير المشتريات', icon: '🧾' },
  { href: '/dashboard/reports/weekly', label: 'التقرير الأسبوعي', icon: '📊' },
  { href: '/dashboard/reports/sales-movement', label: 'حركة المبيعات', icon: '📈' },
  { href: '/dashboard/reports/jaber', label: 'تقرير جابر', icon: '👨‍💼' },
  { href: '/dashboard/reports/bilal', label: 'تقرير بلال', icon: '🚚' },
  { href: '/dashboard/reports/rajeh', label: 'تقرير راجح', icon: '📦' },
  { href: '/dashboard/branches', label: 'الفروع', icon: '🏬' },
  { href: '/dashboard/products', label: 'الأصناف', icon: '🍏' },
  { href: '/dashboard/users', label: 'المستخدمون', icon: '👥' },
  { href: '/dashboard/audit-logs', label: 'سجل التعديلات', icon: '📜' },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)

  // 1. كشف حجم الشاشة
  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 1024)
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  // 2. جلب بيانات المستخدم (مع مؤقت لعدم التعليق)
  useEffect(() => {
    const supabase = createClient()
    const timeout = setTimeout(() => {
      // إذا تأخرت المصادقة، نغلق التحميل المبدئي
      if (!email) setEmail('جاري التحميل...') 
    }, 2000)

    supabase.auth.getSession().then((res) => {
      clearTimeout(timeout)
      if (res.data.session) {
        setEmail(res.data.session.user.email || '')
      }
    }).catch(() => clearTimeout(timeout))

    return () => clearTimeout(timeout)
  }, [])

  // 3. إغلاق القائمة تلقائياً عند التنقل
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // 4. تسجيل الخروج الصارم
  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error(error)
    } finally {
      // إجبار المتصفح على الانتقال لصفحة الدخول وتحديث الذاكرة
      window.location.replace('/') 
    }
  }

  // لا تعرض شيئاً حتى نعرف حجم الشاشة (لمنع ظهور القائمتين معاً)
  if (isDesktop === null) return <div style={{ minHeight: '100vh', background: '#f3f4f6' }}></div>

  const showSidebar = isDesktop || menuOpen

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Arial' }}>
      
      {/* شريط الجوال */}
      {!isDesktop && (
        <header style={{ background: '#065f46', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '24px', padding: '5px 15px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ☰
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>اضواء الريف</span>
            <div style={{ width: '35px', height: '35px', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
              <img src="/logo.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </header>
      )}

      {/* خلفية سوداء للجوال */}
      {!isDesktop && menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }} />
      )}

      {/* القائمة الجانبية */}
      <aside style={{
        width: '260px', background: '#065f46', color: 'white', position: 'fixed',
        top: 0, bottom: 0, 
        right: isDesktop ? 0 : (showSidebar ? 0 : '-280px'), // إخفاء واظهار صارم
        overflowY: 'auto', display: 'flex', flexDirection: 'column', zIndex: 999,
        transition: 'right 0.3s ease-in-out',
        boxShadow: isDesktop ? 'none' : '-5px 0 15px rgba(0,0,0,0.2)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            <img src="/logo.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>اضواء الريف</div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>نظام الإدارة</div>
          </div>
        </div>

        <nav style={{ padding: '10px', flex: 1 }}>
          {MENU.map((item) => {
            const active = pathname === item.href.split('?')[0]
            return (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px',
                color: 'white', textDecoration: 'none', borderRadius: '8px', marginBottom: '2px',
                background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                fontSize: '14px', fontWeight: active ? 'bold' : 'normal'
              }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '5px' }}>مسجل الدخول:</div>
          <div style={{ fontSize: '12px', marginBottom: '10px', wordBreak: 'break-all' }}>{email}</div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '14px' }}>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* المحتوى */}
      <main style={{ padding: '20px', minHeight: '100vh', marginRight: isDesktop ? '260px' : '0', transition: 'margin 0.3s' }}>
        {children}
      </main>
    </div>
  )
}