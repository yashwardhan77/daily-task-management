import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const employeeSession = request.cookies.get('vb-employee-session')?.value
  const adminSession = request.cookies.get('vb-admin-session')?.value

  // 1. Employee Dashboard Route protection
  if (pathname.startsWith('/employee/dashboard')) {
    if (!employeeSession) {
      const url = request.nextUrl.clone()
      url.pathname = '/employee/login'
      return NextResponse.redirect(url)
    }
  }

  // 2. Admin Dashboard Route protection
  if (pathname.startsWith('/admin/dashboard')) {
    if (!adminSession) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  // 3. Prevent logged in employee from going to login page
  if (pathname === '/employee/login') {
    if (employeeSession) {
      const url = request.nextUrl.clone()
      url.pathname = '/employee/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // 4. Prevent logged in admin from going to admin login page
  if (pathname === '/admin/login') {
    if (adminSession) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/employee/dashboard/:path*',
    '/employee/login',
    '/admin/dashboard/:path*',
    '/admin/login',
  ],
}
