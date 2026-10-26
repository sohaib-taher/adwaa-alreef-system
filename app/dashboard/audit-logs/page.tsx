'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

function AuditLogsContent() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const supabase = createClient()
        
        // استخدام getSession بدلاً من getUser (أسرع ولا يتصل بالشبكة)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          window.location.href = '/'
          return
        }

        const { data: userData } = await supabase.from('users').select('company_id').eq('auth_id', session.user.id).single()
        if (!userData) throw new Error('Company not found')

        const { data, error } = await supabase
          .from('audit_logs')
          .select(`id, action, table_name, created_at, old_values, new_values, users ( full_name )`)
          .eq('company_id', userData.company_id)
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error
        if (isMounted) setLogs(data || [])

      } catch (error: any) {
        console.error('Error loading data:', error)
      } finally {
        // هذا السطر هو السحر! يضمن اختفاء "جاري التحميل" حتى لو فشل كل شيء
        if (isMounted) setLoading(false)
      }
    }
    
    loadData()
    return () => { isMounted = false }
  }, [])

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#059669', fontSize: '18px' }}>جاري التحميل...</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl' }}>
      <h1 style={{ margin: '0 0 20px', color: '#065f46', fontSize: '24px' }}>سجل التعديلات</h1>
      
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '10px', color: '#6b7280' }}>لا توجد عمليات مسجلة</div>
      ) : (
        <div style={{ background: 'white', borderRadius: '10px', overflowX: 'auto', padding: '15px' }}>
          <p>تم جلب {logs.length} سجل بنجاح.</p>
        </div>
      )}
    </div>
  )
}

export default function AuditLogsPage() {
  return <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>جاري التحميل...</div>}><AuditLogsContent /></Suspense>
}