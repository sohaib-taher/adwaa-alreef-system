import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const body = await req.json()
    const { action, auth_id, public_id, company_id, admin_id, ...updateData } = body

    if (action === 'delete') {
      // 1. حذف من جدول users العام أولاً
      const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', public_id)
      if (dbError) throw new Error(dbError.message)

      // 2. حذف من نظام المصادقة (Auth)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(auth_id)
      if (authError) throw new Error(authError.message)

      // 3. تسجيل في سجل التدقيق
      await supabaseAdmin.from('audit_logs').insert({
        company_id, user_id: admin_id, action: 'حذف مستخدم', table_name: 'users',
        record_id: public_id, old_values: { note: 'تم حذف المستخدم نهائياً' }
      })

      return NextResponse.json({ success: true, message: 'تم حذف المستخدم بنجاح' })
    }

    if (action === 'update') {
      // 1. تحديث البريد وكلمة المرور في نظام المصادقة (إذا تم إرسالهم)
      const authUpdates: any = {}
      if (updateData.email) authUpdates.email = updateData.email
      if (updateData.password) authUpdates.password = updateData.password

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(auth_id, authUpdates)
        if (authError) throw new Error(authError.message)
      }

      // 2. تحديث البيانات في جدول users العام
      const { error: dbError } = await supabaseAdmin.from('users').update({
        full_name: updateData.full_name,
        email: updateData.email,
        role_id: updateData.role_id,
        branch_id: updateData.branch_id || null,
      }).eq('id', public_id)

      if (dbError) throw new Error(dbError.message)

      // 3. تسجيل في سجل التدقيق
      await supabaseAdmin.from('audit_logs').insert({
        company_id, user_id: admin_id, action: 'تعديل بيانات مستخدم', table_name: 'users',
        record_id: public_id, new_values: updateData
      })

      return NextResponse.json({ success: true, message: 'تم تحديث بيانات المستخدم بنجاح' })
    }

    throw new Error('إجراء غير معروف')

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}