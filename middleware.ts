import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/login', '/signup']
  const isPublicRoute = publicRoutes.includes(pathname)

  // If no token and trying to access protected route, redirect to login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If has token and trying to access public route, redirect to dashboard
  if (token && isPublicRoute) {
    const payload = verifyToken(token)
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

