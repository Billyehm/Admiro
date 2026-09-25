"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Menu, Search } from 'lucide-react'

const titles: Record<string, string> = {
  '/dashboard': 'Overview', '/dashboard/requirements': 'Requirement', '/dashboard/documents': 'My Documents',
  '/dashboard/universities': 'Universities', '/dashboard/updates': 'University Updates', '/dashboard/messages': 'Support Messages',
  '/dashboard/notifications': 'Notifications', '/dashboard/profile': 'Student Profile', '/dashboard/settings': 'Settings', '/dashboard/support': 'Help & Support', '/dashboard/payment': 'Application Payment',
}

export default function Topbar({ onMenu, name }: { onMenu: () => void; name: string }) {
  const pathname = usePathname()
  const title = titles[pathname] ?? (pathname.startsWith('/dashboard/documents/') ? 'Document Upload' : pathname.startsWith('/dashboard/requirements/') ? 'Requirement Details' : pathname.startsWith('/dashboard/universities/') ? 'University Details' : 'Admiro')
  return (
    <header className="adm-topbar">
      <div className="topbar-heading">
        <button className="mobile-menu" aria-label="Open navigation" onClick={onMenu}><Menu /></button>
        <div><p className="topbar-kicker">Student application</p><h1>{title}</h1></div>
      </div>
      <div className="topbar-actions">
        <button className="icon-btn topbar-search" aria-label="Search"><Search /></button>
        <Link className="icon-btn notification-button" aria-label="Notifications, 2 unread" href="/dashboard/notifications"><Bell /><span>2</span></Link>
        <Link href="/dashboard/profile" className="topbar-user"><span className="avatar avatar-small">{name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span><strong>{name.split(' ')[0]}</strong><small>Student</small></span></Link>
      </div>
    </header>
  )
}
