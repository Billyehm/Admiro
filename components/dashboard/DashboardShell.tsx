'use client'

import { useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

export default function DashboardShell({ children, name, unreadNotifications }: { children: React.ReactNode; name: string; unreadNotifications: number }) {
  const [navOpen, setNavOpen] = useState(false)
  return <div className="adm-root"><Sidebar open={navOpen} onClose={() => setNavOpen(false)} name={name} unreadNotifications={unreadNotifications} /><div className="adm-main"><Topbar onMenu={() => setNavOpen(true)} name={name} unreadNotifications={unreadNotifications} /><main className="adm-content">{children}</main></div></div>
}
