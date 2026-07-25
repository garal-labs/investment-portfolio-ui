'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { BarrasPeso } from '@/components/charts/BarrasPeso'
import { DonutChart } from '@/components/charts/DonutChart'
import { Loading, EmptyState } from '@/components/ui/Loading'
import { useAnalisis } from '@/hooks/useCartera'
import { useActiveCartera } from '@/contexts/CarteraContext'

export default function AnalisisPage() {
  const { carteraId, isLoading: carteraLoading } = useActiveCartera()
  const { data: analisis, isLoading, isError } = useAnalisis(carteraId)

  return (
    <AppShell>
      <Topbar title="Análisis" subtitle="Desglose de la cartera" />
      <div className="flex-1 overflow-y-auto p-5">
        {carteraLoading && <Loading text="Cargando carteras..." />}
        {!carteraLoading && carteraId === null && (
          <EmptyState text="No tenés carteras todavía. La gestión de carteras llega próximamente en Ajustes." />
        )}
        {carteraId !== null && isLoading && <Loading text="Calculando desglose..." />}
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
        {carteraId !== null && isError && (
          <EmptyState text="Error al calcular el análisis. Verificá la conexión con el backend." />
        )}
        {carteraId !== null && !isLoading && !isError && !analisis && (
          <EmptyState text="No hay datos de análisis disponibles." />
        )}
      </div>
    </AppShell>
  )
}
