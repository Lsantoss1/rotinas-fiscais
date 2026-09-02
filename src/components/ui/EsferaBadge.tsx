import { cn } from '@/lib/utils'

export type EsferaType = 'federal' | 'estadual' | 'municipal'

const config: Record<EsferaType, { label: string; icon: string; bg: string; border: string; text: string }> = {
  federal: {
    label: 'Federal',
    icon: '🏛️',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200/80 dark:border-indigo-800/40',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  estadual: {
    label: 'Estadual',
    icon: '🗺️',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-200/80 dark:border-violet-800/40',
    text: 'text-violet-700 dark:text-violet-300',
  },
  municipal: {
    label: 'Municipal',
    icon: '🏙️',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-200/80 dark:border-teal-800/40',
    text: 'text-teal-700 dark:text-teal-300',
  },
}

export function EsferaBadge({ esfera, className }: { esfera: string; className?: string }) {
  const item = config[esfera as EsferaType] || config.federal

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border',
        item.bg,
        item.border,
        item.text,
        className
      )}
    >
      <span className="text-[10px]">{item.icon}</span>
      {item.label}
    </span>
  )
}