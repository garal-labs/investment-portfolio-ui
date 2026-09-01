'use client'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { SidebarContext } from '@/contexts/SidebarContext'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const sidebarValue = {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(o => !o),
  }

  return (
    <SidebarContext.Provider value={sidebarValue}>
      <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  )
}
