'use client'
import { useEffect, useRef, useState } from 'react'
import { squarify, tileContent, type SquarifyItem } from '@/lib/squarify'
import { formatPeso, treemapColor } from '@/lib/utils'
import type { CompositionGroup } from '@/lib/portfolio-calc'

interface TreemapProps {
  groups: CompositionGroup[]
  height?: number
  activeKey?: string | null
  onHover?: (key: string | null) => void
}

// Fallback container pixel width before the first ResizeObserver
// measurement — mirrors the reference implementation's `S.tmW || 1110`.
const DEFAULT_WIDTH = 1110

interface TreemapItem extends SquarifyItem, CompositionGroup {}

export function Treemap({ groups, height = 340, activeKey = null, onHover }: TreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pxWidth, setPxWidth] = useState(DEFAULT_WIDTH)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width
      if (!width) return
      setPxWidth(prev => (width !== prev ? width : prev))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const W = (pxWidth / height) * 100
  const H = 100
  const items: TreemapItem[] = groups.map(g => ({ ...g, v: g.valor }))
  const rects = squarify(items, 0, 0, W, H)

  const tiles = rects.map((r, i) => {
    const pw = (r.w / W) * pxWidth
    const ph = (r.h / H) * height
    const { showName, showPct, pctSize, pad } = tileContent(pw, ph)
    const color = treemapColor(i)
    const displayName = pw > 150 ? r.name : (r.short ?? r.name)
    const opacity = activeKey == null || activeKey === r.key ? 1 : 0.3

    return {
      key: r.key,
      name: displayName,
      pct: formatPeso(r.peso),
      title: `${r.name} · ${formatPeso(r.peso)}`,
      left: `${(r.x / W) * 100}%`,
      top: `${(r.y / H) * 100}%`,
      width: `${(r.w / W) * 100}%`,
      height: `${(r.h / H) * 100}%`,
      bg: color.bg,
      fg: color.text,
      showName,
      showPct,
      pctSize,
      pad,
      opacity,
    }
  })

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => onHover?.(null)}
      style={{ position: 'relative', height }}
    >
      {tiles.map(t => (
        <div
          key={t.key}
          data-testid="treemap-tile"
          title={t.title}
          onMouseEnter={() => onHover?.(t.key)}
          style={{
            position: 'absolute',
            left: t.left,
            top: t.top,
            width: t.width,
            height: t.height,
            padding: 2,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 8,
              background: t.bg,
              color: t.fg,
              opacity: t.opacity,
              transition: 'opacity .15s',
              padding: t.pad,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
            }}
          >
            {t.showName && (
              <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.25 }}>{t.name}</p>
            )}
            {t.showPct && (
              <p
                className="font-serif"
                style={{ fontSize: t.pctSize, fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}
              >
                {t.pct}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
