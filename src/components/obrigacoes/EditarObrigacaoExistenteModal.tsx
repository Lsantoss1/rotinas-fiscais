"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Trash2, Calendar, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatarCNPJ } from "@/lib/utils/cnpj";

interface ObrigacaoEditData {
  id: string;
  prazo_vencimento: string;
  status: string;
  observacoes?: string | null;
  tipo_obrigacao?: {
    nome: string;
    esfera: string;
  };
  estabelecimento?: {
    razao_social: string;
    cnpj: string;
    grupo?: {
      nome: string;
    };
  };
}

export function EditarObrigacaoExistenteModal({
  obrigacao,
  triggerClassName,
}: {
  obrigacao: ObrigacaoEditData;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [vencimento, setVencimento] = useState(
    obrigacao.prazo_vencimento ? obrigacao.prazo_vencimento.split("T")[0] : ""
  );
  const [status, setStatus] = useState(obrigacao.status || "pendente");
  const [observacoes, setObservacoes] = useState(obrigacao.observacoes || "");

  const tipoNome = obrigacao.tipo_obrigacao?.nome || "Obrigação";
  const empresaNome = obrigacao.estabelecimento?.razao_social || "";
  const cnpj = obrigacao.estabelecimento?.cnpj || "";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/obrigacoes/${obrigacao.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prazo_vencimento: vencimento,
          status,
          observacoes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar alterações");

      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Deseja realmente remover/excluir a obrigação "${tipoNome}" para a empresa ${empresaNome}?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/obrigacoes/${obrigacao.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erro ao excluir obrigação");

      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={triggerClassName || "inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 p-1 rounded transition-colors cursor-pointer"}>
        <Edit2 className="h-3.5 w-3.5" /> Editar
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-indigo-600" /> Editar Obrigação
          </DialogTitle>
          <DialogDescription>
            {tipoNome} — <span className="font-semibold">{empresaNome}</span> ({formatarCNPJ(cnpj)})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {error && (
            <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-md border border-rose-200">
              {error}
            </div>
          )}

          {/* Vencimento */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Data de Vencimento *</Label>
            <Input
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              required
            />
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Status Atual</Label>
            <Select value={status} onValueChange={(val) => setStatus(val || "pendente")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">🟡 Pendente</SelectItem>
                <SelectItem value="assumida">🔷 Em Andamento</SelectItem>
                <SelectItem value="entregue">🟢 Entregue</SelectItem>
                <SelectItem value="atrasada">🔴 Atrasada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Observações / Notas internas</Label>
            <Textarea
              placeholder="Ex: Empresa dispensada nesta competência por falta de movimento..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1"
              disabled={loading}
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir esta obrigação
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1" disabled={loading}>
                <Check className="h-3.5 w-3.5" /> {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}