'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, UserPlus, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Obrigacao } from '@/types/database'

export function ObrigacaoAcoes({
  obrigacao,
  currentUserId,
}: {
  obrigacao: Obrigacao & { anexos?: any[] }
  currentUserId: string
}) {
  const [loading, setLoading] = useState(false)
  const [observacao, setObservacao] = useState(obrigacao.observacoes ?? '')
  const router = useRouter()
  const supabase = createClient()

  async function assumir() {
    setLoading(true)
    await supabase
      .from('obrigacoes')
      .update({
        status: 'assumida',
        responsavel_id: currentUserId,
        assumida_em: new Date().toISOString(),
      })
      .eq('id', obrigacao.id)
    router.refresh()
    setLoading(false)
  }

  async function concluir() {
    const temAnexo = (obrigacao.anexos?.length ?? 0) > 0
    if (!temAnexo) {
      alert('Faça upload de pelo menos um comprovante antes de concluir.')
      return
    }
    setLoading(true)
    await supabase
      .from('obrigacoes')
      .update({
        status: 'entregue',
        entregue_em: new Date().toISOString(),
        observacoes: observacao || null,
      })
      .eq('id', obrigacao.id)
    router.refresh()
    setLoading(false)
  }

  async function salvarObservacao() {
    setLoading(true)
    await supabase
      .from('obrigacoes')
      .update({ observacoes: observacao || null })
      .eq('id', obrigacao.id)
    router.refresh()
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Ações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {obrigacao.status === 'pendente' && (
          <Button onClick={assumir} disabled={loading} className="w-full gap-2">
            <UserPlus className="h-4 w-4" />
            Assumir obrigação
          </Button>
        )}

        {obrigacao.status === 'assumida' && (
          <Button onClick={concluir} disabled={loading} className="w-full gap-2 bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Marcar como entregue
          </Button>
        )}

        {obrigacao.status === 'entregue' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Entregue!</span>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs">Observações</Label>
          <Textarea
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            placeholder="Notas sobre esta obrigação..."
            className="text-sm resize-none"
            rows={3}
          />
          <Button variant="outline" size="sm" onClick={salvarObservacao} disabled={loading} className="w-full">
            Salvar observações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}