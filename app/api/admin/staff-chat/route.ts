import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { getStaffChatMessages } from '@/lib/data/admin'
import { staffMessageSchema, zodErrorMessage } from '@/lib/validation'

export async function POST(request: Request) {
  const { supabase, user, staff } = await getApiUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!staff) return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  const parsed = staffMessageSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 })
  const { data, error } = await supabase.rpc('send_staff_message', { message_body: parsed.data.body, reply_to_message_id: parsed.data.replyToId })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const message = (await getStaffChatMessages()).find((item) => item.id === data)
  if (!message) return NextResponse.json({ error: 'Message was saved but could not be loaded.' }, { status: 500 })
  return NextResponse.json({ message })
}
