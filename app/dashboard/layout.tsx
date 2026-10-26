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
  { href: '/dashboard/purchases', label: 'فواتير المشتريات', icon: '🧾' },
  { href: '/dashboard/transfers', label: 'التحويلات بين الفروع', icon: '🔄' },
  { href: '/dashboard/debts', label: 'المديونيات والسداد', icon: '📋' },
  { href: '/dashboard/reports/weekly', label: 'التقرير الأسبوعي', icon: '📊' },
  { href: '/dashboard/reports/sales-movement', label: 'حركة المبيعات', icon: '📈' },
  { href: '/dashboard/reports/jaber', label: 'تقرير جابر (فواكه)', icon: '👨‍💼' },
  { href: '/dashboard/reports/bilal', label: 'تقرير بلال (خضار)', icon: '🚚' },
  { href: '/dashboard/reports/rajeh', label: 'تقرير راجح (ورقيات)', icon: '📦' },
  { href: '/dashboard/branches', label: 'الفروع', icon: '🏬' },
  { href: '/dashboard/products', label: 'الأصناف', icon: '🍏' },
  { href: '/dashboard/users', label: 'المستخدمون والصلاحيات', icon: '👥' },
  { href: '/dashboard/audit-logs', label: 'سجل العمليات', icon: '🛡️' },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [company, setCompany] = useState<'adwaa' | 'taj'>('adwaa')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then((res) => {
      setEmail(res.data.session?.user?.email || 'مستخدم النظام')
    })
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 font-sans text-gray-900">
      
      {/* 1. Header يظهر فقط في الشاشات الصغيرة (الجوال والتابلت) */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-emerald-900 px-4 py-3 text-white shadow-md">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-md bg-white/10 px-3 py-1.5 text-xl font-bold hover:bg-white/20"
          aria-label="فتح القائمة"
        >
          ☰
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">
            {company === 'adwaa' ? 'أضواء الريف' : 'تاج خضاري'}
          </span>
          <div className="h-8 w-8 rounded bg-white p-1">
            <img src="/logo.png" alt="logo" className="h-full w-full object-contain" />
          </div>
        </div>
      </header>

      {/* 2. خلفية معتمة عند فتح قائمة الجوال */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* 3. القائمة الجانبية الثابتة في سطح المكتب والمتنقلة في الجوال */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-64 flex-col bg-emerald-950 text-white shadow-2xl transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* الترويسة ومبدّل الشركة */}
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-white p-1">
              <img src="/logo.png" alt="logo" className="h-full w-full object-contain" />
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-base tracking-wide truncate">
                {company === 'adwaa' ? 'أضواء الريف' : 'تاج خضاري'}
              </div>
              <div className="text-xs text-emerald-400">نظام الإدارة والمحاسبة</div>
            </div>
          </div>

          {/* محول الشركة السريع (تطبيقاً لمتطلب REQ-001) */}
          <div className="mt-3 flex rounded-md bg-emerald-900/80 p-0.5 text-xs">
            <button
              onClick={() => setCompany('adwaa')}
              className={`flex-1 rounded py-1 font-medium transition-colors ${
                company === 'adwaa' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-200 hover:text-white'
              }`}
            >
              أضواء الريف
            </button>
            <button
              onClick={() => setCompany('taj')}
              className={`flex-1 rounded py-1 font-medium transition-colors ${
                company === 'taj' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-200 hover:text-white'
              }`}
            >
              تاج خضاري
            </button>
          </div>
        </div>

        {/* عناصر القائمة الجانبية */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {MENU.map((item) => {
            const isActive = pathname === item.href.split('?')[0]
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-emerald-700 text-white font-bold shadow-xs'
                    : 'text-emerald-100 hover:bg-emerald-900/60 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* معلومات المستخدم وتسجيل الخروج */}
        <div className="border-t border-white/10 bg-emerald-950/90 p-3">
          <div className="text-[11px] text-emerald-400 mb-1">المستخدم الحالي:</div>
          <div className="text-xs font-mono text-white/90 truncate mb-2">{email}</div>
          <button
            onClick={handleLogout}
            className="w-full rounded-md bg-red-600 hover:bg-red-700 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* 4. منطقة المحتوى الرئيسي */}
      <main className="min-h-screen p-4 lg:p-6 lg:mr-64 transition-all duration-200">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}