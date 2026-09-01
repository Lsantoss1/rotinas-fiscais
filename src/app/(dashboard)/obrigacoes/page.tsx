import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const statusLabel: Record<string, string> = {
  pendente: 'Pendente',
  assumida: 'Em andamento',
  entregue: 'Entregue',
  atrasada: 'Atrasada',
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  assumida: 'bg-blue-100 text-blue-800 border-blue-200',
  entregue: 'bg-green-100 text-green-800 border-green-200',
  atrasada: 'bg-red-100 text-red-800 border-red-200',
}

const esfereColors: Record<string, string> = {
  federal: 'bg-blue-50 text-blue-700 border-blue-100',
  estadual: 'bg-purple-50 text-purple-700 border-purple-100',
  municipal: 'bg-green-50 text-green-700 border-green-100',
}

async function getObrigacoes() {
  const supabase = await createClient()
  const hoje = new Date()
  const mesAtual = format(hoje, 'yyyy-MM-01')

  const { data } = await supabase
    .from('obrigacoes')
    .select(`
      id, prazo_vencimento, status, competencia, assumida_em, entregue_em,
      tipo_obrigacao:tipos_obrigacao(id, nome, esfera, periodicidade),
      estabelecimento:estabelecimentos(id, razao_social, cnpj, is_matriz, grupo:grupos(id, nome)),
      responsavel:usuarios(id, nome)
    `)
    .gte('competencia', mesAtual)
    .order('prazo_vencimento', { ascending: true })
    .limit(100)

  return data ?? []
}

export default async function ObrigacoesPage() {
  const obrigacoes = await getObrigacoes()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Obrigações</h1>
          <p className="text-gray-500 text-sm mt-1">Todas as obrigações do período atual</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Obrigação</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente / CNPJ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Competência</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vencimento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {obrigacoes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      Nenhuma obrigação encontrada para este período.
                    </td>
                  </tr>
                )}
                {obrigacoes.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <Link href={`/obrigacoes/${o.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {o.tipo_obrigacao?.nome}
                        </Link>
                        <div className="mt-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${esfereColors[o.tipo_obrigacao?.esfera]}`}>
                            {o.tipo_obrigacao?.esfera}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{o.estabelecimento?.grupo?.nome}</p>
                      <p className="text-xs text-gray-500">
                        {o.estabelecimento?.razao_social}
                        {o.estabelecimento?.is_matriz ? ' (Matriz)' : ' (Filial)'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {o.competencia ? format(new Date(o.competencia + 'T12:00:00'), 'MM/yyyy') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${
                        new Date(o.prazo_vencimento) < new Date() && o.status !== 'entregue'
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}>
                        {format(new Date(o.prazo_vencimento + 'T12:00:00'), 'dd/MM/yyyy')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusColors[o.status]}`}>
                        {statusLabel[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {o.responsavel?.nome ?? <span className="text-gray-400 italic">Não atribuído</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
