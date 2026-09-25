import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { getStaffChatMessages } from '@/lib/data/admin'
import { editStaffMessageSchema, zodErrorMessage } from '@/lib/validation'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user, staff } = await getApiUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!staff) return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
  const parsed = editStaffMessageSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 })
  const { id } = await params
  const { data, error } = await supabase.rpc('edit_staff_message', { target_message_id: id, replacement_body: parsed.data.body })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const message = (await getStaffChatMessages()).find((item) => item.id === data)
  if (!message) return NextResponse.json({ error: 'Message was updated but could not be loaded.' }, { status: 500 })
  return NextResponse.json({ message })
}
