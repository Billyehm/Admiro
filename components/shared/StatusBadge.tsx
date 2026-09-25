const styles: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  resolved: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  resubmission_requested: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  low: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  normal: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  high: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  urgent: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

export default function StatusBadge({ value }: { value: string }) {
  return <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset ${styles[value] ?? styles.normal}`}>
    {value.replaceAll('_', ' ')}
  </span>
}
