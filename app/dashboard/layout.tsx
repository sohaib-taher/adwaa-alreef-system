import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial', background: '#f3f4f6' }}>
      
      {/* القائمة الجانبية الثابتة */}
      <aside style={{ 
        width: '260px', 
        background: '#065f46', 
        color: 'white', 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        right: 0
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>اضواء الريف</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link href="/dashboard" style={{ color: 'white', textDecoration: 'none', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px' }}>الرئيسية</Link>
          <Link href="/dashboard/revenues" style={{ color: 'white', textDecoration: 'none', padding: '10px' }}>الإيرادات</Link>
          <Link href="/dashboard/daily-receipts?type=vegetable" style={{ color: 'white', textDecoration: 'none', padding: '10px' }}>استلام خضار</Link>
          <Link href="/dashboard/reports/jaber" style={{ color: 'white', textDecoration: 'none', padding: '10px' }}>تقرير جابر</Link>
        </nav>
      </aside>

      {/* محتوى الصفحة */}
      <main style={{ flex: 1, marginRight: '260px', padding: '20px' }}>
        {children}
      </main>

    </div>
  )
}