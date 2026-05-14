export function Loading({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3" style={{ color: 'var(--color-muted)' }}>
      <div
        className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
      />
      <p className="text-sm font-lora italic">{text}</p>
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center flex-1" style={{ color: 'var(--color-muted)' }}>
      <p className="font-lora italic text-sm">{text}</p>
    </div>
  )
}
