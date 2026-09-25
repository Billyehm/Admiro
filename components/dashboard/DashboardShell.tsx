'use client'

import { useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

export default function DashboardShell({ children, name }: { children: React.ReactNode; name: string }) {
  const [navOpen, setNavOpen] = useState(false)
  return <div className="adm-root"><Sidebar open={navOpen} onClose={() => setNavOpen(false)} name={name} /><div className="adm-main"><Topbar onMenu={() => setNavOpen(true)} name={name} /><main className="adm-content">{children}</main></div></div>
}
