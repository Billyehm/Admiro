import { redirect } from 'next/navigation'
import type { AppRole } from '@/lib/database.types'
import { createClient } from '@/lib/supabase/server'

export type AuthenticatedUser = {
  id: string
  email: string
  role: AppRole
  displayName: string
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const id = data?.claims?.sub
  if (!id) redirect('/auth')

  const { data: user, error } = await supabase
    .from('users')
    .select('id,email,role')
    .eq('id', id)
    .single()
  if (error || !user) redirect('/auth')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', id)
    .maybeSingle()

  return { id: user.id, email: user.email, role: user.role, displayName: profile?.full_name || user.email }
}

export async function requireStaff(): Promise<AuthenticatedUser> {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('user_id,display_name,role_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()
  if (!adminUser) redirect('/dashboard')

  const { data: role } = await supabase.from('roles').select('name').eq('id', adminUser.role_id).single()
  if (!role || !['admin', 'support_agent'].includes(role.name)) redirect('/dashboard')

  return { ...user, role: role.name, displayName: adminUser.display_name }
}

export async function requireAdmin() {
  const user = await requireStaff()
  if (user.role !== 'admin') redirect('/admin')
  return user
}
