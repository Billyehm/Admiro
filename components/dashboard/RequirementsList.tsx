import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Requirement } from '@/lib/models'
import StatusBadge from './StatusBadge'

export default function RequirementsList({ items, compact = false }: { items: Requirement[]; compact?: boolean }) {
  return <div className={`requirements-list ${compact ? 'compact' : ''}`}>{items.map((item) => (
    <Link key={item.id} href={`/dashboard/requirements/${item.id}`} className="requirement-item">
      <div className="requirement-copy"><strong>{item.title}</strong><span>{item.note || item.description}</span></div>
      <div className="requirement-meta"><StatusBadge status={item.status} /><span className="row-arrow"><ArrowRight /></span></div>
    </Link>
  ))}</div>
}
