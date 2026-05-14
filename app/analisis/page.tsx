'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { BarrasPeso } from '@/components/charts/BarrasPeso'
import { DonutChart } from '@/components/charts/DonutChart'
import { Loading, EmptyState } from '@/components/ui/Loading'
import { useAnalisis } from '@/hooks/useCartera'
import { DEFAULT_CARTERA_ID } from '@/lib/config'

const CARTERA_ID = DEFAULT_CARTERA_ID

export default function AnalisisPage() {
  const { data: analisis, isLoading, isError } = useAnalisis(CARTERA_ID)

  return (
    <AppShell>
      <Topbar title="Análisis" subtitle="Desglose de la cartera" carteraId={CARTERA_ID} />
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading && <Loading text="Calculando desglose..." />}
        {analisis && (
          <div className="grid grid-cols-2 gap-4">
            <DonutChart data={analisis.por_sector} title="Por sector" />
            <DonutChart data={analisis.por_pais}   title="Por país" />
            <DonutChart data={analisis.por_tipo}   title="Por tipo de activo" />
            <DonutChart data={analisis.por_moneda} title="Por moneda" />
            <div className="col-span-2">
              <BarrasPeso data={analisis.por_sector} title="Peso por sector (detalle)" />
            </div>
          </div>
        )}
        {isError && (
          <EmptyState text="Error al calcular el análisis. Verificá la conexión con el backend." />
        )}
        {!isLoading && !isError && !analisis && (
          <EmptyState text="No hay datos de análisis disponibles." />
        )}
      </div>
    </AppShell>
  )
}
