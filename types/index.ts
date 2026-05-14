// ── Entidades base ────────────────────────────────────────────────────────────

export interface Cartera {
  id: number
  nombre: string
  descripcion?: string
  created_at: string
}

export interface Instrumento {
  id: number
  isin: string
  ticker?: string
  nombre?: string
  tipo?: string       // accion | etf | fondo | otro
  sector?: string
  pais?: string
  moneda?: string
  exchange?: string
}

export interface Movimiento {
  id: number
  cartera_id: number
  instrumento: Instrumento
  tipo: 'compra' | 'venta'
  fecha: string
  cantidad: number
  precio: number
  comision: number
  tipo_cambio?: number
  notas?: string
  created_at: string
}

// ── Datos calculados ──────────────────────────────────────────────────────────

export interface Posicion {
  instrumento: Instrumento
  cantidad_actual: number
  coste_total: number
  precio_medio: number
  plusvalia_realizada: number
  precio_actual?: number
  valor_actual?: number
  plusvalia_latente?: number
  rentabilidad_pct?: number
  plusvalia_total?: number
}

export interface ResumenCartera {
  cartera: Cartera
  valor_total: number
  coste_total: number
  plusvalia_latente: number
  plusvalia_realizada: number
  plusvalia_total: number
  rentabilidad_pct: number
  num_posiciones: number
  posiciones: Posicion[]
}

export interface GrupoAnalisis {
  nombre: string
  valor: number
  peso_pct: number
}

export interface AnalisisCartera {
  por_sector: GrupoAnalisis[]
  por_pais: GrupoAnalisis[]
  por_tipo: GrupoAnalisis[]
  por_moneda: GrupoAnalisis[]
}

// ── Formularios ───────────────────────────────────────────────────────────────

export interface MovimientoCreate {
  cartera_id: number
  isin: string
  tipo: 'compra' | 'venta'
  fecha: string
  cantidad: number
  precio: number
  comision?: number
  tipo_cambio?: number
  notas?: string
}

export interface CarteraCreate {
  nombre: string
  descripcion?: string
}

export interface InstrumentoUpdate {
  ticker?: string
  nombre?: string
  tipo?: string
  sector?: string
  pais?: string
  moneda?: string
  exchange?: string
}
