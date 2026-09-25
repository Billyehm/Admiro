import { createClient } from '@/lib/supabase/server'
import type { TableRow } from '@/lib/database.types'

export async function getApplicantDocuments(userId: string): Promise<TableRow<'uploaded_documents'>[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('uploaded_documents').select('*').eq('user_id', userId).order('submitted_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getApplicantTickets(userId: string) {
  const supabase = await createClient()
  const { data: tickets, error } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
  if (error) throw error
  if (!tickets?.length) return []
  const { data: messages } = await supabase.from('support_messages').select('*').in('ticket_id', tickets.map((ticket) => ticket.id)).order('created_at')
  return tickets.map((ticket) => ({ ...ticket, messages: (messages ?? []).filter((message) => message.ticket_id === ticket.id) }))
}
