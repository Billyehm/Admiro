import { AlertCircle, CheckCircle2, Circle, Clock3 } from 'lucide-react'
import type { RequirementStatus } from '@/lib/database.types'

const statusIcons = {
  not_started: Circle,
  processing: Clock3,
  action_needed: AlertCircle,
  completed: CheckCircle2,
}

export default function StatusBadge({ status }: { status: RequirementStatus }) {
  const Icon = statusIcons[status]
  const label = status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  return <span className={`status-badge status-${status.replaceAll('_', '-')}`}><Icon aria-hidden="true" />{label}</span>
}
