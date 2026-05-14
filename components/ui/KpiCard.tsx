interface KpiCardProps {
  label: string
  value: string
  sub?: string
  color?: 'default' | 'positive' | 'negative' | 'amber'
}

const colorMap = {
  default:  'var(--color-ink)',
  positive: 'var(--color-primary)',
  negative: 'var(--color-plum)',
  amber:    'var(--color-amber)',
}

export function KpiCard({ label, value, sub, color = 'default' }: KpiCardProps) {
  return (
    <div className="card p-[12px_14px]">
      <p className="section-label">{label}</p>
      <p
        className="font-serif text-[20px] font-bold"
        style={{ color: colorMap[color] }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
