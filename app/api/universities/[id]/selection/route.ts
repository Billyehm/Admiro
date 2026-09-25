import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await getApiUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const { id } = await params
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return NextResponse.json({ error: 'Invalid university' }, { status: 400 })
  const { data, error } = await supabase.rpc('toggle_university_selection', { target_university_id: id })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ selected: data })
}
