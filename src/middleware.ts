import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
  const isCustomerRoute = req.nextUrl.pathname.startsWith('/customer')
  const isVendorRoute = req.nextUrl.pathname.startsWith('/vendor')
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')

  // 인증 페이지가 아니고 로그인 안 되어 있으면 로그인 페이지로
  if (!isAuthPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', req.nextUrl))
  }

  // 역할 기반 접근 제어
  if (isLoggedIn) {
    const userRole = req.auth?.user?.role

    if (isAdminRoute && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.nextUrl))
    }

    if (isVendorRoute && userRole !== 'VENDOR' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.nextUrl))
    }

    if (isCustomerRoute && userRole !== 'CUSTOMER' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
