'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { VistaSection } from '@/components/settings/VistaSection'

export default function AjustesPage() {
  return (
    <AppShell>
      <Topbar title="Ajustes" subtitle="Configuración de la app" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <VistaSection />

        <div className="card p-5 max-w-md">
          <p className="section-label">Próximamente</p>
          <p className="font-lora italic text-sm" style={{ color: 'var(--color-muted)' }}>
            Gestión de carteras, exportar CSV, configurar FMP API key…
          </p>
        </div>
      </div>
    </AppShell>
  )
}
