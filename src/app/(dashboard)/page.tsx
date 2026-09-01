import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'

async function getStats() {
  const supabase = await createClient()
  const hoje = new Date()
  const inicio = format(startOfMonth(hoje), 'yyyy-MM-dd')
  const fim = format(endOfMonth(hoje), 'yyyy-MM-dd')

  const [pendentes, assumidas, entregues, atrasadas] = await Promise.all([
    supabase.from('obrigacoes').select('*', { count: 'exact', head: true }).eq('status', 'pendente').gte('prazo_vencimento', inicio).lte('prazo_vencimento', fim),
    supabase.from('obrigacoes').select('*', { count: 'exact', head: true }).eq('status', 'assumida'),
    supabase.from('obrigacoes').select('*', { count: 'exact', head: true }).eq('status', 'entregue').gte('entregue_em', inicio),
    supabase.from('obrigacoes').select('*', { count: 'exact', head: true }).eq('status', 'atrasada'),
  ])

  return {
    pendentes: pendentes.count ?? 0,
    assumidas: assumidas.count ?? 0,
    entregues: entregues.count ?? 0,
    atrasadas: atrasadas.count ?? 0,
  }
}

async function getProximasObrigacoes() {
  const supabase = await createClient()
  const hoje = format(new Date(), 'yyyy-MM-dd')
  const em10dias = format(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

  const { data } = await supabase
    .from('obrigacoes')
    .select(`
      id, prazo_vencimento, status,
      tipo_obrigacao:tipos_obrigacao(nome, esfera),
      estabelecimento:estabelecimentos(razao_social, cnpj, grupo:grupos(nome))
    `)
    .in('status', ['pendente', 'assumida'])
    .gte('prazo_vencimento', hoje)
    .lte('prazo_vencimento', em10dias)
    .order('prazo_vencimento', { ascending: true })
    .limit(10)

  return data ?? []
}

async function getAtrasadas() {
  const supabase = await createClient()
  const hoje = format(new Date(), 'yyyy-MM-dd')

  const { data } = await supabase
    .from('obrigacoes')
    .select(`
      id, prazo_vencimento, status,
      tipo_obrigacao:tipos_obrigacao(nome, esfera),
      estabelecimento:estabelecimentos(razao_social, cnpj, grupo:grupos(nome))
    `)
    .in('status', ['pendente', 'assumida'])
    .lt('prazo_vencimento', hoje)
    .order('prazo_vencimento', { ascending: true })
    .limit(10)

  return data ?? []
}

const esfereColors: Record<string, string> = {
  federal: 'bg-blue-100 text-blue-800',
  estadual: 'bg-purple-100 text-purple-800',
  municipal: 'bg-green-100 text-green-800',
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  assumida: 'bg-blue-100 text-blue-800',
  entregue: 'bg-green-100 text-green-800',
  atrasada: 'bg-red-100 text-red-800',
}

export default async function DashboardPage() {
  const [stats, proximas, atrasadas] = await Promise.all([
    getStats(),
    getProximasObrigacoes(),
    getAtrasadas(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel Geral</h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Pendentes (mês)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg"><Clock className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Em andamento</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assumidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Entregues (mês)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.entregues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg"><XCircle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">{stats.atrasadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vencendo em 10 dias */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Vencendo nos próximos 10 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximas.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma obrigação vencendo em breve.</p>
            ) : (
              <div className="space-y-3">
                {proximas.map((o: any) => (
                  <Link key={o.id} href={`/obrigacoes/${o.id}`} className="block">
                    <div className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{o.tipo_obrigacao?.nome}</p>
                        <p className="text-xs text-gray-500">{o.estabelecimento?.grupo?.nome} — {o.estabelecimento?.razao_social}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-xs font-semibold text-orange-600">
                          {format(new Date(o.prazo_vencimento + 'T12:00:00'), 'dd/MM')}
                        </p>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${esfereColors[o.tipo_obrigacao?.esfera]}`}>
                          {o.tipo_obrigacao?.esfera}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atrasadas */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Em atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atrasadas.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma obrigação em atraso. ✨</p>
            ) : (
              <div className="space-y-3">
                {atrasadas.map((o: any) => (
                  <Link key={o.id} href={`/obrigacoes/${o.id}`} className="block">
                    <div className="flex items-start justify-between p-3 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{o.tipo_obrigacao?.nome}</p>
                        <p className="text-xs text-gray-500">{o.estabelecimento?.grupo?.nome} — {o.estabelecimento?.razao_social}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-xs font-semibold text-red-600">
                          {format(new Date(o.prazo_vencimento + 'T12:00:00'), 'dd/MM')}
                        </p>
                        <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-medium">ATRASADO</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
