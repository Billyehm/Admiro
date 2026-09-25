import { Clock3, MessageCircle } from 'lucide-react'
import type { SupportTicket } from '@/lib/models'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/format'

export default function SupportTicketCard({ ticket, active, onSelect }: { ticket: SupportTicket; active: boolean; onSelect: () => void }) {
  return <button onClick={onSelect} className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-[#64806b] bg-[#f3f8ed] shadow-sm' : 'border-[#dfe3da] bg-white hover:border-[#b8c5b5]'}`}>
    <div className="flex items-start justify-between gap-3"><StatusBadge value={ticket.status} /><StatusBadge value={ticket.priority} /></div>
    <h3 className="mt-3 font-bold text-[#17231b]">{ticket.subject}</h3>
    <p className="mt-1 text-sm text-[#667069]">{ticket.applicantName} · {ticket.applicantEmail}</p>
    <div className="mt-3 flex items-center justify-between text-xs text-[#7c857f]"><span className="flex items-center gap-1"><MessageCircle className="size-3.5" />{ticket.messages.length}</span><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{formatDate(ticket.updatedAt)}</span></div>
  </button>
}
