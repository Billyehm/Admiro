import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'
import { isSupabaseConfigured, getSupabaseEnv } from '@/lib/supabase/env'

const authRoutes = ['/dashboard', '/admin', '/operations']

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request })

  let response = NextResponse.next({ request })
  const { url, publishableKey } = getSupabaseEnv()
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  const pathname = request.nextUrl.pathname
  const needsAuth = authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  if (needsAuth && !userId) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth'
    loginUrl.searchParams.set('next', pathname)
    const redirect = NextResponse.redirect(loginUrl)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  if (userId && (pathname.startsWith('/admin') || pathname.startsWith('/operations'))) {
    const { data: staff } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (!staff) {
      const destination = request.nextUrl.clone()
      destination.pathname = '/dashboard'
      destination.search = ''
      const redirect = NextResponse.redirect(destination)
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
      return redirect
    }
  }

  return response
}
