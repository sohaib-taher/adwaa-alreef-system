import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // استخدام المفتاح السري (لا يظهر للمتصفح أبداً)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const body = await req.json()
    const { email, password, full_name, company_id, branch_id, role_id } = body

    // 1. إنشاء المستخدم في نظام المصادقة (Auth)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // تأكيد البريد تلقائياً
    })

    if (authError) throw new Error(authError.message)

    // 2. إضافة المستخدم في جدول المستخدمين العام (users)
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      auth_id: authData.user.id,
      email,
      full_name,
      company_id,
      branch_id: branch_id || null,
      role_id,
      is_active: true
    })

    if (dbError) throw new Error(dbError.message)

    return NextResponse.json({ success: true, message: 'تم إنشاء المستخدم بنجاح' })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}