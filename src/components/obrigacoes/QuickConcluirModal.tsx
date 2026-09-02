"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Upload, FileText, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ObrigacaoQuickData {
  id: string;
  tipo_obrigacao?: {
    nome: string;
  };
  estabelecimento?: {
    razao_social: string;
    nome_fantasia?: string;
  };
}

export function QuickConcluirModal({
  obrigacao,
  open,
  onOpenChange,
}: {
  obrigacao: ObrigacaoQuickData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  if (!obrigacao) return null;

  const tipoNome = obrigacao.tipo_obrigacao?.nome || "Obrigação";
  const empresaNome = obrigacao.estabelecimento?.nome_fantasia || obrigacao.estabelecimento?.razao_social || "";

  async function handleConcluir(e: React.FormEvent) {
    e.preventDefault();
    if (!obrigacao) return;
    setError(null);

    if (!file) {
      setError("Por favor, selecione ou envie o arquivo do comprovante (PDF ou Excel).");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ext = file.name.split(".").pop();
      const storagePath = `comprovantes/${obrigacao.id}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("fiscal-docs")
        .upload(storagePath, file, { upsert: true });

      if (uploadErr) {
        console.warn("Storage warning:", uploadErr.message);
      }

      if (!uploadErr) {
        await supabase.from("anexos").insert({
          obrigacao_id: obrigacao.id,
          nome_original: file.name,
          nome_storage: file.name,
          storage_path: storagePath,
          mime_type: file.type || "application/pdf",
          tamanho_bytes: file.size,
          enviado_por: user?.id || null,
        });
      }

      const { error: updateErr } = await supabase
        .from("obrigacoes")
        .update({
          status: "entregue",
          entregue_em: new Date().toISOString(),
          observacoes: observacao || undefined,
        })
        .eq("id", obrigacao.id);

      if (updateErr) throw new Error(updateErr.message);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFile(null);
        setObservacao("");
        onOpenChange(false);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Erro ao concluir obrigação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" /> Finalizar & Entregar Obrigação
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{tipoNome}</span> — {empresaNome}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-3 animate-in fade-in zoom-in duration-200">
            <div className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 p-4 rounded-full h-16 w-16 mx-auto flex items-center justify-center shadow-inner">
              <Sparkles className="h-8 w-8 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Obrigação Entregue com Sucesso! 🎉
            </h3>
            <p className="text-xs text-slate-500">Comprovante anexado e status atualizado.</p>
          </div>
        ) : (
          <form onSubmit={handleConcluir} className="space-y-4 pt-2">
            {error && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-md border border-rose-200">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Anexar Comprovante / Recibo (PDF ou Excel) *</Label>
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
                  file
                    ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
                    : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/50"
                }`}
                onClick={() => document.getElementById("file-upload-input")?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <FileText className="h-5 w-5" />
                    <span className="text-xs font-semibold truncate max-w-[240px]">{file.name}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="h-6 w-6 mx-auto text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Clique para escolher o arquivo
                    </p>
                    <p className="text-[11px] text-slate-400">PDF, Excel ou recibos de transmissão (máx 20MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nota de Conclusão / Observações (opcional)</Label>
              <Textarea
                placeholder="Ex: Transmitido com sucesso sem pendências..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-xs"
                disabled={loading}
              >
                <CheckCircle2 className="h-4 w-4" />
                {loading ? "Enviando..." : "Confirmar Conclusão"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}