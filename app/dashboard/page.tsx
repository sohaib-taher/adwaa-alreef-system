'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SECTIONS = [
  {
    title: 'العمليات اليومية',
    description: 'سندات استلام البضاعة اليومية والمبيعات',
    items: [
      { href: '/dashboard/daily-receipts?type=vegetable', label: 'استلام خضار', icon: '🥬', color: 'border-emerald-200 hover:border-emerald-500' },
      { href: '/dashboard/daily-receipts?type=fruit', label: 'استلام فواكه', icon: '🍎', color: 'border-red-200 hover:border-red-500' },
      { href: '/dashboard/daily-receipts?type=paper', label: 'استلام ورقيات', icon: '📄', color: 'border-green-200 hover:border-green-500' },
      { href: '/dashboard/worker-confirm', label: 'تأكيد استلام العمال', icon: '👷‍♂️', color: 'border-amber-200 hover:border-amber-500' },
      { href: '/dashboard/worker-approval', label: 'اعتماد الإدارة', icon: '✅', color: 'border-teal-200 hover:border-teal-500' },
      { href: '/dashboard/revenues', label: 'الإيرادات اليومية', icon: '💰', color: 'border-yellow-200 hover:border-yellow-500' },
      { href: '/dashboard/purchases', label: 'فواتير المشتريات', icon: '🧾', color: 'border-blue-200 hover:border-blue-500' },
      { href: '/dashboard/transfers', label: 'التحويلات بين الفروع', icon: '🔄', color: 'border-purple-200 hover:border-purple-500' },
      { href: '/dashboard/debts', label: 'المديونيات والسداد', icon: '📋', color: 'border-indigo-200 hover:border-indigo-500' },
    ]
  },
  {
    title: 'التقارير والمناديب',
    description: 'التقارير الأسبوعية المجمعة وحسابات الموردين',
    items: [
      { href: '/dashboard/reports/weekly', label: 'التقرير الأسبوعي', icon: '📊', color: 'border-emerald-200 hover:border-emerald-500' },
      { href: '/dashboard/reports/sales-movement', label: 'حركة المبيعات', icon: '📈', color: 'border-cyan-200 hover:border-cyan-500' },
      { href: '/dashboard/reports/jaber', label: 'تقرير جابر (فواكه)', icon: '👨‍💼', color: 'border-orange-200 hover:border-orange-500' },
      { href: '/dashboard/reports/bilal', label: 'تقرير بلال (خضار)', icon: '🚚', color: 'border-lime-200 hover:border-lime-500' },
      { href: '/dashboard/reports/rajeh', label: 'تقرير عبده راجح (ورقيات)', icon: '📦', color: 'border-emerald-200 hover:border-emerald-500' },
    ]
  },
  {
    title: 'الإدارة والإعدادات',
    description: 'التحكم بالفروع، الأصناف، المستخدمين وسجلات النظام',
    items: [
      { href: '/dashboard/branches', label: 'الفروع', icon: '🏬', color: 'border-gray-200 hover:border-emerald-500' },
      { href: '/dashboard/products', label: 'الأصناف', icon: '🍏', color: 'border-gray-200 hover:border-emerald-500' },
      { href: '/dashboard/users', label: 'المستخدمون والصلاحيات', icon: '👥', color: 'border-gray-200 hover:border-emerald-500' },
      { href: '/dashboard/audit-logs', label: 'سجل العمليات', icon: '🛡️', color: 'border-gray-200 hover:border-emerald-500' },
      { href: '/dashboard/settings', label: 'الإعدادات', icon: '⚙️', color: 'border-gray-200 hover:border-emerald-500' },
    ]
  }
]

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function checkSession() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error.message)
        }

        if (isMounted) {
          if (!data?.session) {
            router.push('/')
          } else {
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('Unexpected auth error:', err)
        if (isMounted) {
          // في حال حدوث خطأ غير متوقع، ننهي التحميل حتى لا تتجمد الشاشة
          setLoading(false)
        }
      }
    }

    checkSession()

    // مؤقت أمان لضمان عدم تعليق الشاشة أبداً أكثر من 3 ثوانٍ
    const safetyTimer = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false)
      }
    }, 3000)

    return () => {
      isMounted = false
      clearTimeout(safetyTimer)
    }
  }, [router, loading])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        <span className="text-sm font-medium text-emerald-800">جاري تحميل لوحة التحكم...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* الترويسة الرئيسية */}
      <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم الرئيسية</h1>
          <p className="text-sm text-gray-500 mt-1">نظام إدارة ومحاسبة مؤسسة أضواء الريف وتاج خضاري</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            النظام متصل
          </span>
        </div>
      </div>

      {/* أقسام العمليات */}
      {SECTIONS.map((section, idx) => (
        <section key={idx} className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{section.title}</h2>
            <p className="text-xs text-gray-500">{section.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex flex-col items-center justify-center p-4 bg-white rounded-xl border ${item.color} shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5`}
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-150">
                  {item.icon}
                </span>
                <span className="text-xs font-bold text-gray-800 text-center line-clamp-1 group-hover:text-emerald-700">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}