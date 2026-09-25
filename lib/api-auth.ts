import { createClient } from '@/lib/supabase/server'

export async function getApiUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const id = data?.claims?.sub
  if (!id) return { supabase, user: null, staff: false }

  const { data: user } = await supabase.from('users').select('id,email,role').eq('id', id).maybeSingle()
  if (!user) return { supabase, user: null, staff: false }

  const { data: admin } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', id)
    .eq('is_active', true)
    .maybeSingle()

  return { supabase, user, staff: Boolean(admin) }
}
