import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { createTicketSchema, zodErrorMessage } from '@/lib/validation'

export async function POST(request: Request) {
  const { supabase, user } = await getApiUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const parsed = createTicketSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 })

  const { data, error } = await supabase.rpc('create_support_ticket', {
    ticket_subject: parsed.data.subject,
    first_message: parsed.data.message,
    ticket_priority: parsed.data.priority,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data }, { status: 201 })
}
