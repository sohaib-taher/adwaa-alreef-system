'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    companies: 0, branches: 0, products: 0, suppliers: 0,
    purchases: 0, revenues: 0, transfers: 0, debts: 0,
  })
  const [recentPurchases, setRecentPurchases] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const counts = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('branches').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }),
        supabase.from('purchases').select('*', { count: 'exact', head: true }),
        supabase.from('revenues').select('*', { count: 'exact', head: true }),
        supabase.from('transfers').select('*', { count: 'exact', head: true }),
        supabase.from('debts').select('*', { count: 'exact', head: true }),
      ])

      setStats({
        companies: counts[0].count || 0,
        branches: counts[1].count || 0,
        products: counts[2].count || 0,
        suppliers: counts[3].count || 0,
        purchases: counts[4].count || 0,
        revenues: counts[5].count || 0,
        transfers: counts[6].count || 0,
        debts: counts[7].count || 0,
      })

      const { data } = await supabase
        .from('purchases')
        .select(`id, purchase_date, qty, unit_price, total_with_tax, branches(name), categories(name), products(name)`)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentPurchases(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#059669', fontSize: '18px' }}>جاري التحميل...</div>

  return (
    <div>
      {/* العنوان */}
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '26px' }}>لوحة التحكم الرئيسية</h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>نظرة عامة على النظام</p>
      </div>

      {/* البطاقات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <StatCard title="الشركات" value={stats.companies} icon="🏢" color="#059669" />
        <StatCard title="الفروع" value={stats.branches} icon="🏬" color="#10b981" />
        <StatCard title="الأصناف" value={stats.products} icon="📦" color="#f59e0b" />
        <StatCard title="الموردين" value={stats.suppliers} icon="🚚" color="#ef4444" />
        <StatCard title="المشتريات" value={stats.purchases} icon="🛒" color="#8b5cf6" />
        <StatCard title="الإيرادات" value={stats.revenues} icon="💰" color="#06b6d4" />
        <StatCard title="التحويلات" value={stats.transfers} icon="🔄" color="#f97316" />
        <StatCard title="المديونيات" value={stats.debts} icon="📋" color="#dc2626" />
      </div>

      {/* الوصول السريع */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '25px' }}>
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '18px' }}>⚡ الوصول السريع</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <QuickLink href="/dashboard/purchases" icon="🛒" label="إضافة مشترى" />
          <QuickLink href="/dashboard/revenues" icon="💰" label="إضافة إيراد" />
          <QuickLink href="/dashboard/transfers" icon="🔄" label="تحويل بضاعة" />
          <QuickLink href="/dashboard/reports" icon="📊" label="التقارير" />
        </div>
      </div>

      {/* آخر المشتريات */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '18px' }}>🕒 آخر المشتريات</h2>
        {recentPurchases.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>لا توجد مشتريات بعد</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f0fdf4', color: '#065f46' }}>
                  <th style={th}>التاريخ</th>
                  <th style={th}>الفرع</th>
                  <th style={th}>التصنيف</th>
                  <th style={th}>الصنف</th>
                  <th style={th}>الكمية</th>
                  <th style={th}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={td}>{p.purchase_date}</td>
                    <td style={td}>{p.branches?.name}</td>
                    <td style={td}>{p.categories?.name}</td>
                    <td style={td}>{p.products?.name}</td>
                    <td style={td}>{p.qty}</td>
                    <td style={{ ...td, fontWeight: 'bold', color: '#059669' }}>{p.total_with_tax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderRight: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ color: '#6b7280', fontSize: '13px' }}>{title}</span>
        <span style={{ fontSize: '22px' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#111827' }}>{value}</div>
    </div>
  )
}

function QuickLink({ href, icon, label }: any) {
  return (
    <Link href={href} style={{ padding: '15px', background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: '10px', textAlign: 'center', textDecoration: 'none', color: '#065f46', fontSize: '14px', fontWeight: 'bold' }}>
      <div style={{ fontSize: '22px', marginBottom: '5px' }}>{icon}</div>
      {label}
    </Link>
  )
}

const th: React.CSSProperties = { padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold' }
const td: React.CSSProperties = { padding: '12px', textAlign: 'right', color: '#374151' }