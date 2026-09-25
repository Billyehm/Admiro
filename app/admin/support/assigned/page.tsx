import SupportInbox from '@/components/admin/SupportInbox'
import { requireStaff } from '@/lib/auth'
import { getSupportTickets } from '@/lib/data/admin'

export default async function AssignedTicketsPage() {
  const user = await requireStaff()
  const tickets = await getSupportTickets(user.id)
  return <div className="mx-auto max-w-7xl"><div className="mb-6"><p className="text-sm font-bold uppercase tracking-[.16em] text-[#54725d]">Personal queue</p><h2 className="mt-2 text-4xl font-semibold tracking-[-.045em]">Assigned tickets</h2><p className="mt-2 text-[#667069]">Conversations currently assigned to {user.displayName}.</p></div><SupportInbox initialTickets={tickets} /></div>
}
