'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const today = new Date().toISOString().slice(0, 10)

function getMonday() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d.setDate(diff))
  return mon.toISOString().slice(0, 10)
}

const defaultFromDate = getMonday()

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [fromDate, setFromDate] = useState(defaultFromDate)
  const [toDate, setToDate] = useState(today)
  const [data, setData] = useState<any>({
    purchases: [],
    revenues: [],
    summary: {},
  })

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    loadReports()
  }, [fromDate, toDate, selectedBranch])

  async function loadBranches() {
    const supabase = createClient()
    const userRes = await supabase.auth.getUser()
    if (!userRes.data.user) {
      window.location.href = '/'
      return
    }

    const br = await supabase
      .from('branches')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    setBranches(br.data || [])
    setLoading(false)
  }

  async function loadReports() {
    const supabase = createClient()

    let purchasesQuery = supabase
      .from('purchases')
      .select(
        'purchase_date, total_with_tax, tax_amount, branches(name), categories(name)'
      )
      .gte('purchase_date', fromDate)
      .lte('purchase_date', toDate)

    if (selectedBranch) {
      purchasesQuery = purchasesQuery.eq('branch_id', selectedBranch)
    }

    let revenuesQuery = supabase
      .from('revenues')
      .select(
        'revenue_date, network_amount, cash_amount, expenses, invoices, total_sales, branches(name)'
      )
      .gte('revenue_date', fromDate)
      .lte('revenue_date', toDate)

    if (selectedBranch) {
      revenuesQuery = revenuesQuery.eq('branch_id', selectedBranch)
    }

    const pur = await purchasesQuery
    const rev = await revenuesQuery

    const totalPurchases = (pur.data || []).reduce(
      (s, p) => s + Number(p.total_with_tax || 0),
      0
    )
    const totalSales = (rev.data || []).reduce(
      (s, r) => s + Number(r.total_sales || 0),
      0
    )
    const totalNetwork = (rev.data || []).reduce(
      (s, r) => s + Number(r.network_amount || 0),
      0
    )
    const totalCash = (rev.data || []).reduce(
      (s, r) => s + Number(r.cash_amount || 0),
      0
    )

    setData({
      purchases: pur.data || [],
      revenues: rev.data || [],
      summary: {
        totalPurchases,
        totalSales,
        totalNetwork,
        totalCash,
        profit: totalSales - totalPurchases,
        countPurchases: (pur.data || []).length,
        countRevenues: (rev.data || []).length,
      },
    })
  }

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: '#059669' }}>
        جاري التحميل...
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: 0, color: '#065f46', fontSize: '26px' }}>
          التقارير
        </h1>
        <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>
          تقارير المشتريات والمبيعات حسب الفترة والفرع
        </p>
      </div>

      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          marginBottom: '25px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '15px',
          }}
        >
          <Field label="من تاريخ">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={input}
            />
          </Field>
          <Field label="إلى تاريخ">
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={input}
            />
          </Field>
          <Field label="الفرع">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              style={input}
            >
              <option value="">كل الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '15px',
          marginBottom: '25px',
        }}
      >
        <StatCard
          title="إجمالي المشتريات"
          value={data.summary.totalPurchases}
          icon="🛒"
          color="#8b5cf6"
        />
        <StatCard
          title="إجمالي المبيعات"
          value={data.summary.totalSales}
          icon="💰"
          color="#06b6d4"
        />
        <StatCard
          title="الشبكة"
          value={data.summary.totalNetwork}
          icon="🏦"
          color="#059669"
        />
        <StatCard
          title="الكاش"
          value={data.summary.totalCash}
          icon="💵"
          color="#10b981"
        />
        <StatCard
          title="صافي الربح"
          value={data.summary.profit}
          icon="📈"
          color={data.summary.profit >= 0 ? '#059669' : '#dc2626'}
        />
      </div>

      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <h2 style={{ margin: '0 0 15px', color: '#065f46', fontSize: '17px' }}>
          ملخص الفترة
        </h2>
        <p style={{ margin: '8px 0', color: '#374151' }}>
          عدد المشتريات:{' '}
          <strong style={{ color: '#8b5cf6' }}>
            {data.summary.countPurchases}
          </strong>
        </p>
        <p style={{ margin: '8px 0', color: '#374151' }}>
          عدد الإيرادات:{' '}
          <strong style={{ color: '#06b6d4' }}>
            {data.summary.countRevenues}
          </strong>
        </p>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div
      style={{
        background: 'white',
        padding: '20px',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        borderRight: `4px solid ${color}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span style={{ color: '#6b7280', fontSize: '13px' }}>{title}</span>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827' }}>
        {Number(value || 0).toFixed(2)}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#374151',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '2px solid #e5e7eb',
  borderRadius: '10px',
  fontSize: '14px',
  boxSizing: 'border-box',
  color: '#111827',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
}