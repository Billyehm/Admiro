import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { reviewDocumentSchema, zodErrorMessage } from '@/lib/validation'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user, staff } = await getApiUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!staff) return NextResponse.json({ error: 'Staff access required' }, { status: 403 })

  const parsed = reviewDocumentSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 })
  const { id } = await params
  const { data, error } = await supabase.rpc('review_document', {
    target_document_id: id,
    decision: parsed.data.status,
    notes: parsed.data.internalNotes,
    message_to_applicant: parsed.data.applicantMessage,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ id: data })
}
