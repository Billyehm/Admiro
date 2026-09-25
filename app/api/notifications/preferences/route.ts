import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { notificationPreferencesSchema, zodErrorMessage } from '@/lib/validation'

export async function PUT(request: Request) {
  const { supabase, user } = await getApiUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const parsed = notificationPreferencesSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 })
  const { error } = await supabase.from('notification_preferences').upsert({ user_id: user.id, preferences: parsed.data.preferences })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
