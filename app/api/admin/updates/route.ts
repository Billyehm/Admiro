import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { createUniversityUpdateSchema, zodErrorMessage } from '@/lib/validation'

export async function POST(request: Request) {
  const { supabase, user, staff } = await getApiUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!staff || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  const parsed = createUniversityUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 })
  const { data, error } = await supabase.rpc('create_university_update', {
    update_title: parsed.data.title,
    update_description: parsed.data.description,
    update_category: parsed.data.category,
    target_university_id: parsed.data.universityId,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ id: data })
}
