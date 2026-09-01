import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { History } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusLabel: Record<string, string> = {
  pendente: 'Pendente',
  assumida: 'Assumida',
  entregue: 'Entregue',
  atrasada: 'Atrasada',
}

export function HistoricoList({ historico }: { historico: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" /> Histórico
        </CardTitle>
      </CardHeader>
      <CardContent>
        {historico.length === 0 ? (
          <p className="text-sm text-gray-400">Sem movimentações registradas.</p>
        ) : (
          <div className="space-y-3">
            {historico.map(h => (
              <div key={h.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">
                    Status alterado para <strong>{statusLabel[h.status_novo]}</strong>
                    {h.status_anterior && <> (era: {statusLabel[h.status_anterior]})</>}
                    {h.responsavel?.nome && <> por <strong>{h.responsavel.nome}</strong></>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(h.criado_em), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  {h.observacao && <p className="text-xs text-gray-500 mt-1">{h.observacao}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}