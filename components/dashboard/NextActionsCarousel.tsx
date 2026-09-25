"use client"

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react'
import type { Requirement } from '@/lib/models'

export default function NextActionsCarousel({ actions }: { actions: Requirement[] }) {
  const [current, setCurrent] = useState(0)
  const action = actions[current]

  if (!action) return null

  const previous = () => setCurrent((index) => (index - 1 + actions.length) % actions.length)
  const next = () => setCurrent((index) => (index + 1) % actions.length)

  return (
    <section className="next-action-card">
      <div className="next-action-topline">
        <div className="next-action-icon"><AlertTriangle /></div>
        {actions.length > 1 && <div className="carousel-controls" aria-label="Browse next actions"><button aria-label="Previous action" onClick={previous}><ArrowLeft /></button><button aria-label="Next action" onClick={next}><ArrowRight /></button></div>}
      </div>
      <span className="card-eyebrow">Your next action</span>
      <h2>{action.title}</h2>
      <p>{action.note || action.description}</p>
      <div className="next-action-footer">
        <Link href={`/dashboard/requirements/${action.id}`}>Open requirement <ArrowRight /></Link>
        {actions.length > 1 && <span>{current + 1} of {actions.length}</span>}
      </div>
    </section>
  )
}
