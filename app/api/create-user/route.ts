import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  try {
    const { email, password, full_name, company_id, branch_id, role_id } = await req.json()
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })
    if (authError) throw new Error(authError.message)
    const { error: dbError } = await supabaseAdmin.from('users').insert({ auth_id: authData.user.id, email, full_name, company_id, branch_id: branch_id || null, role_id, is_active: true })
    if (dbError) throw new Error(dbError.message)
    return NextResponse.json({ success: true, message: 'تم إنشاء المستخدم بنجاح' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}