import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { requirementTextSchema, zodErrorMessage } from '@/lib/validation'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await getApiUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (user.role !== 'applicant') return NextResponse.json({ error: 'Applicant access required' }, { status: 403 })
  const parsed = requirementTextSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 })
  const { id } = await params
  const { error } = await supabase.rpc('submit_requirement_text', { target_requirement_id: id, submitted_text: parsed.data.text })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
