import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // تم تعطيل الحماية مؤقتاً لحل مشكلة الطرد
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}