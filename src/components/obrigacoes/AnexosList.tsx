'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Download, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { Anexo } from '@/types/database'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AnexosList({
  obrigacaoId,
  anexos,
}: {
  obrigacaoId: string
  anexos: Anexo[]
}) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      alert('Arquivo muito grande. Limite máximo: 20 MB.')
      return
    }

    setUploading(true)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const ext = file.name.split('.').pop()
    const nomeStorage = `${obrigacaoId}_${timestamp}.${ext}`
    const storagePath = `comprovantes/${nomeStorage}`

    const { error: uploadError } = await supabase.storage
      .from('fiscal-docs')
      .upload(storagePath, file)

    if (uploadError) {
      alert('Erro ao fazer upload: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('anexos').insert({
      obrigacao_id: obrigacaoId,
      nome_original: file.name,
      nome_storage: nomeStorage,
      storage_path: storagePath,
      mime_type: file.type,
      tamanho_bytes: file.size,
      enviado_por: user?.id ?? null,
    })

    router.refresh()
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDownload(anexo: Anexo) {
    const { data } = await supabase.storage
      .from('fiscal-docs')
      .createSignedUrl(anexo.storage_path, 60)
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  async function handleDelete(anexo: Anexo) {
    if (!confirm(`Excluir "${anexo.nome_original}"?`)) return
    await supabase.storage.from('fiscal-docs').remove([anexo.storage_path])
    await supabase.from('anexos').delete().eq('id', anexo.id)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Comprovantes e Anexos
          </CardTitle>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Enviando...' : 'Anexar arquivo'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {anexos.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
            <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhum comprovante anexado</p>
            <p className="text-xs text-gray-400 mt-1">PDF ou Excel, até 20 MB</p>
          </div>
        ) : (
          <div className="space-y-2">
            {anexos.map(anexo => (
              <div key={anexo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{anexo.nome_original}</p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(anexo.tamanho_bytes)} · {format(new Date(anexo.criado_em), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(anexo)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(anexo)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}