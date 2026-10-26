'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const T = {
  appName: 'اضواء الريف',
  appSub: 'نظام الإدارة',
  main: 'الرئيسية',
  dailyOps: 'العمليات اليومية',
  receiptVeg: 'استلام خضار',
  receiptFruit: 'استلام فواكه',
  workerConfirm: 'تأكيد استلام العمال',
  workerApproval: 'اعتماد الإدارة',
  revenues: 'الإيرادات اليومية',
  
  reports: 'التقارير',
  weekly: 'التقرير الأسبوعي',
  salesMove: 'حركة المبيعات',
  jaber: 'تقرير جابر',
  bilal: 'تقرير بلال',
  rajeh: 'تقرير عبده راجح',

  admin: 'الإدارة',
  branches: 'الفروع',
  products: 'الأصناف',
  users: 'المستخدمون',
  settings: 'الإعدادات',
  
  loggedIn: 'مسجل الدخول:',
  logout: 'تسجيل الخروج'
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 1024)
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then((res) => setEmail(res.data.session?.user.email || ''))
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isSidebarVisible = isDesktop || menuOpen

  const MenuItem = ({ href, label, icon }: { href: string, label: string, icon: string }) => {
    const active = pathname === href
    return (
      <Link href={href} style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px',
        color: 'white', textDecoration: 'none', borderRadius: '8px', marginBottom: '2px',
        background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
        fontSize: '14px', fontWeight: active ? 'bold' : 'normal'
      }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <span>{label}</span>
      </Link>
    )
  }

  const SectionTitle = ({ title }: { title: string }) => (
    <div style={{ padding: '15px 15px 5px', fontSize: '12px', color: '#9ca3af', fontWeight: 'bold' }}>
      {title}
    </div>
  )

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Arial' }}>
      
      {/* Header للجوال */}
      {!isDesktop && (
        <header style={{ background: '#065f46', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '20px', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>{T.appName}</span>
            <div style={{ width: '35px', height: '35px', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
              <img src="/logo.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </header>
      )}

      {!isDesktop && menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }} />
      )}

      {/* القائمة الجانبية */}
      <aside style={{
        width: '260px', background: '#065f46', color: 'white', position: 'fixed',
        right: isSidebarVisible ? 0 : -280, top: 0, bottom: 0, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', zIndex: 999, transition: 'right 0.3s'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            <img src="/logo.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{T.appName}</div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>{T.appSub}</div>
          </div>
        </div>

        <nav style={{ padding: '10px', flex: 1 }}>
          <MenuItem href="/dashboard" label={T.main} icon="🏠" />
          
          <SectionTitle title={T.dailyOps} />
          <MenuItem href="/dashboard/daily-receipts?type=vegetable" label={T.receiptVeg} icon="🥬" />
          <MenuItem href="/dashboard/daily-receipts?type=fruit" label={T.receiptFruit} icon="🍎" />
          <MenuItem href="/dashboard/worker-confirm" label={T.workerConfirm} icon="👷‍♂️" />
          <MenuItem href="/dashboard/worker-approval" label={T.workerApproval} icon="✅" />
          <MenuItem href="/dashboard/revenues" label={T.revenues} icon="💰" />

          <SectionTitle title={T.reports} />
          <MenuItem href="/dashboard/reports/weekly" label={T.weekly} icon="📊" />
          <MenuItem href="/dashboard/reports/sales-movement" label={T.salesMove} icon="📈" />
          <MenuItem href="/dashboard/reports/jaber" label={T.jaber} icon="👨‍💼" />
          <MenuItem href="/dashboard/reports/bilal" label={T.bilal} icon="🚚" />
          <MenuItem href="/dashboard/reports/rajeh" label={T.rajeh} icon="📦" />

          <SectionTitle title={T.admin} />
          <MenuItem href="/dashboard/branches" label={T.branches} icon="🏬" />
          <MenuItem href="/dashboard/products" label={T.products} icon="🍏" />
          <MenuItem href="/dashboard/users" label={T.users} icon="👥" />
          <MenuItem href="/dashboard/settings" label={T.settings} icon="⚙️" />
        </nav>

        <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '5px' }}>{T.loggedIn}</div>
          <div style={{ fontSize: '12px', marginBottom: '10px', wordBreak: 'break-all' }}>{email}</div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {T.logout}
          </button>
        </div>
      </aside>

      {/* المحتوى */}
      <main style={{ padding: '20px', minHeight: '100vh', marginRight: isDesktop ? '260px' : '0' }}>
        {children}
      </main>
    </div>
  )
}