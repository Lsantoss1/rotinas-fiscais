import { addDays, addMonths, setDate, endOfMonth, isWeekend, format, parseISO } from 'date-fns'
import { Feriado, RegraVencimento } from '@/types/database'

/**
 * Verifica se uma data e dia util (nao e fim de semana nem feriado)
 */
export function isDiaUtil(date: Date, feriados: Feriado[]): boolean {
  if (isWeekend(date)) return false
  const dateStr = format(date, 'yyyy-MM-dd')
  return !feriados.some(f => f.data === dateStr)
}

/**
 * Avanca para o proximo dia util se a data cair em fim de semana ou feriado
 */
export function proximoDiaUtil(date: Date, feriados: Feriado[]): Date {
  let d = new Date(date)
  while (!isDiaUtil(d, feriados)) {
    d = addDays(d, 1)
  }
  return d
}

/**
 * Retrocede para o ultimo dia util se a data cair em fim de semana ou feriado
 */
export function ultimoDiaUtil(date: Date, feriados: Feriado[]): Date {
  let d = new Date(date)
  while (!isDiaUtil(d, feriados)) {
    d = addDays(d, -1)
  }
  return d
}

/**
 * Calcula o prazo de vencimento a partir de uma formula e competencia
 */
export function calcularPrazo(
  formula: string,
  parametro: number | null,
  competencia: Date,
  feriados: Feriado[]
): Date {
  switch (formula) {
    case 'dia_N_mes_seguinte': {
      const n = parametro ?? 20
      const mesSeguite = addMonths(competencia, 1)
      const candidata = setDate(mesSeguite, n)
      return proximoDiaUtil(candidata, feriados)
    }
    case 'dia_N_mes_corrente': {
      const n = parametro ?? 20
      const candidata = setDate(competencia, n)
      return proximoDiaUtil(candidata, feriados)
    }
    case 'ultimo_dia_util_mes_seguinte': {
      const mesSeguite = addMonths(competencia, 1)
      const ultimoDia = endOfMonth(mesSeguite)
      return ultimoDiaUtil(ultimoDia, feriados)
    }
    case 'ultimo_dia_util_mes_corrente': {
      const ultimoDia = endOfMonth(competencia)
      return ultimoDiaUtil(ultimoDia, feriados)
    }
    case 'ultimo_dia_util_junho_ano_seguinte': {
      const junho = new Date(competencia.getFullYear() + 1, 5, 30)
      return ultimoDiaUtil(junho, feriados)
    }
    case 'ultimo_dia_util_julho_ano_seguinte': {
      const julho = new Date(competencia.getFullYear() + 1, 6, 31)
      return ultimoDiaUtil(julho, feriados)
    }
    default:
      // Fallback: dia 20 do mes seguinte
      return proximoDiaUtil(setDate(addMonths(competencia, 1), 20), feriados)
  }
}

/**
 * Encontra a regra de vencimento vigente para uma data de competencia
 */
export function regraVigenteParaData(
  regras: RegraVencimento[],
  competencia: Date
): RegraVencimento | null {
  const competenciaStr = format(competencia, 'yyyy-MM-dd')
  return regras.find(r => {
    const inicio = r.valida_de
    const fim = r.valida_ate
    const aposInicio = competenciaStr >= inicio
    const antesFim = !fim || competenciaStr <= fim
    return aposInicio && antesFim
  }) ?? null
}

/**
 * Calcula a diferenca em dias entre hoje e o prazo
 */
export function diasParaVencimento(prazoStr: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const prazo = parseISO(prazoStr)
  prazo.setHours(0, 0, 0, 0)
  return Math.round((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Retorna a cor/urgencia do prazo
 */
export function urgenciaPrazo(diasRestantes: number): 'ok' | 'alerta' | 'urgente' | 'vencido' {
  if (diasRestantes < 0) return 'vencido'
  if (diasRestantes === 0) return 'urgente'
  if (diasRestantes <= 3) return 'urgente'
  if (diasRestantes <= 10) return 'alerta'
  return 'ok'
}
