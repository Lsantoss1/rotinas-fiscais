import { cn } from '@/lib/utils'

export type StatusObrigacao = 'pendente' | 'assumida' | 'entregue' | 'atrasada'

const config: Record<StatusObrigacao, { label: string; bg: string; border: string; text: string; dot: string }> = {
  pendente: {
    label: 'Pendente',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200/80 dark:border-amber-800/40',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  assumida: {
    label: 'Em Andamento',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200/80 dark:border-sky-800/40',
    text: 'text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500 animate-pulse',
  },
  entregue: {
    label: 'Entregue',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200/80 dark:border-emerald-800/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  atrasada: {
    label: 'Atrasada',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200/80 dark:border-rose-800/40',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const item = config[status as StatusObrigacao] || config.pendente

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-xs',
        item.bg,
        item.border,
        item.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', item.dot)} />
      {item.label}
    </span>
  )
}