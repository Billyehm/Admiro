'use client'

import { useState } from 'react'
import { Menu, Search } from 'lucide-react'
import type { AppRole } from '@/lib/database.types'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminShell({ children, name, role }: { children: React.ReactNode; name: string; role: AppRole }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  return <div className="min-h-screen bg-[#f5f6f2] text-[#17231b] lg:flex"><AdminSidebar name={name} role={role} collapsed={collapsed} mobileOpen={mobileOpen} onToggle={() => setCollapsed((value) => !value)} onMobileClose={() => setMobileOpen(false)} /><main className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-[#dfe3da] bg-white/90 px-4 backdrop-blur-xl sm:px-7"><div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="grid size-10 place-items-center rounded-xl border border-[#dfe3da] lg:hidden"><Menu className="size-5" /></button><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#64806b]">{role === 'admin' ? 'Administration' : 'Support operations'}</p><h1 className="text-lg font-bold">{role === 'admin' ? 'Admin workspace' : 'Agent workspace'}</h1></div></div><div className="flex items-center gap-2"><button className="hidden h-10 items-center gap-2 rounded-xl border border-[#dfe3da] bg-white px-3 text-sm text-[#667069] sm:flex"><Search className="size-4" />Search</button></div></header><div className="p-4 sm:p-7 xl:p-8">{children}</div></main></div>
}
