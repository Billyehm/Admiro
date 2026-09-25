'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellOff } from 'lucide-react'

export default function UniversitySelectionButton({ universityId, initialSelected }: { universityId: string; initialSelected: boolean }) {
  const router = useRouter()
  const [selected, setSelected] = useState(initialSelected)
  const [error, setError] = useState('')
  async function toggle() {
    setError('')
    const response = await fetch(`/api/universities/${universityId}/selection`, { method: 'POST' })
    const result = await response.json()
    if (!response.ok) { setError(result.error || 'Unable to update'); return }
    setSelected(result.selected); router.refresh()
  }
  return <div><button className={`adm-button ${selected ? 'button-light-outline' : 'button-lime'}`} onClick={toggle}>{selected ? <><BellOff />Turn off updates</> : <><Bell />Get updates</>}</button>{error && <p className="mt-2 text-xs text-rose-200">{error}</p>}</div>
}
