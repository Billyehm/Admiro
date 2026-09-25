import { CheckCircle2 } from 'lucide-react'

export default function ProgressCard({ percent, completed, total, remaining }: { percent: number; completed: number; total: number; remaining: number }) {
  return (
    <section className="adm-card progress-card">
      <div className="card-heading"><div><span className="card-eyebrow">Application progress</span><h2>Your application at a glance</h2></div><span className="progress-icon"><CheckCircle2 /></span></div>
      <div className="progress-kpi"><strong>{percent}%</strong><span>complete</span></div>
      <div className="progress-track" aria-label={`${percent}% complete`}><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
      <div className="progress-summary"><span><strong>{completed}</strong> of {total} requirements completed</span><span><strong>{remaining}</strong> need your attention</span></div>
      {percent === 100 && <div className="completion-note"><CheckCircle2 /><div><strong>All your stages have been completed</strong><span>All that’s left now is to wait for your admission status. Congratulations, and good luck!</span></div></div>}
    </section>
  )
}
