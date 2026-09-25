import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { replyToTicketSchema, zodErrorMessage } from '@/lib/validation'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user, staff } = await getApiUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const parsed = replyToTicketSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 })
  if ((parsed.data.internal || parsed.data.status) && !staff) {
    return NextResponse.json({ error: 'Only staff can create internal notes or change ticket status' }, { status: 403 })
  }

  const { id } = await params
  const { data, error } = await supabase.rpc('reply_support_ticket', {
    target_ticket_id: id,
    message_body: parsed.data.message,
    next_status: parsed.data.status ?? null,
    internal_message: parsed.data.internal,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ id: data }, { status: 201 })
}
