import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { notificationReadSchema, zodErrorMessage } from '@/lib/validation'

export async function POST(request: Request) {
  const { supabase, user } = await getApiUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const parsed = notificationReadSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 })
  let query = supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id)
  if (parsed.data.ids?.length) query = query.in('id', parsed.data.ids)
  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
