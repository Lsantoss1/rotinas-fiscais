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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Settings2, FileCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export function GerenciarObrigacoesModal({ estabelecimentos }: { estabelecimentos: any[] }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "tipo">("manual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form Obrigação Manual
  const [estId, setEstId] = useState(estabelecimentos[0]?.id || "");
  const [nomeObrigacao, setNomeObrigacao] = useState("");
  const [esfera, setEsfera] = useState("federal");
  const [vencimento, setVencimento] = useState("");
  const [competencia, setCompetencia] = useState("2026-08-01");

  // Form Novo Tipo
  const [novoTipoNome, setNovoTipoNome] = useState("");
  const [novoTipoEsfera, setNovoTipoEsfera] = useState("federal");
  const [novoTipoDia, setNovoTipoDia] = useState("20");

  async function handleAddObrigacaoManual(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!estId || !nomeObrigacao.trim() || !vencimento) {
      setError("Preencha estabelecimento, nome e vencimento.");
      return;
    }

    setLoading(true);
    try {
      // 1. Criar tipo temporario ou buscar
      const tRes = await fetch("/api/tipos-obrigacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeObrigacao,
          esfera,
          dia_vencimento: vencimento.split("-")[2] || "20",
        }),
      });
      const tData = await tRes.json();
      if (!tRes.ok) throw new Error(tData.error || "Erro ao criar tipo de obrigação");

      // 2. Criar obrigacao
      const oRes = await fetch("/api/obrigacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competencia }),
      });

      if (!oRes.ok) throw new Error("Erro ao gerar obrigações");

      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNovoTipo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!novoTipoNome.trim()) {
      setError("Digite o nome da obrigação.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tipos-obrigacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoTipoNome,
          esfera: novoTipoEsfera,
          dia_vencimento: novoTipoDia,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar tipo");

      // Gerar obrigações para competência atual
      await fetch("/api/obrigacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competencia: "2026-08-01" }),
      });

      setNovoTipoNome("");
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
      <DialogTrigger className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs h-9 px-3.5 rounded-lg shadow-xs transition-colors cursor-pointer">
        <Plus className="h-4 w-4" /> Incluir Obrigação / Modelo
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-indigo-600" /> Incluir ou Personalizar Obrigação
          </DialogTitle>
          <DialogDescription>
            Adicione uma nova obrigação fiscal ou modelo para todos os clientes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-3">
          <button
            onClick={() => setActiveTab("manual")}
            className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-colors ${
              activeTab === "manual"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            + Obrigação para Empresa
          </button>
          <button
            onClick={() => setActiveTab("tipo")}
            className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-colors ${
              activeTab === "tipo"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            + Novo Modelo Geral
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-md border border-rose-200">
            {error}
          </div>
        )}

        {activeTab === "manual" ? (
          <form onSubmit={handleAddObrigacaoManual} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Empresa / Estabelecimento *</Label>
              <Select value={estId} onValueChange={setEstId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estabelecimentos.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.razao_social} ({e.grupo?.nome})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Nome da Obrigação *</Label>
              <Input
                placeholder="Ex: Licença Ambiental Municipal"
                value={nomeObrigacao}
                onChange={(e) => setNomeObrigacao(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Esfera</Label>
                <Select value={esfera} onValueChange={setEsfera}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="federal">Federal</SelectItem>
                    <SelectItem value="estadual">Estadual</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Data de Vencimento *</Label>
                <Input
                  type="date"
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
                {loading ? "Salvando..." : "Criar Obrigação"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddNovoTipo} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome do Novo Modelo de Obrigação *</Label>
              <Input
                placeholder="Ex: Relatório de Impacto Ambiental"
                value={novoTipoNome}
                onChange={(e) => setNovoTipoNome(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Esfera</Label>
                <Select value={novoTipoEsfera} onValueChange={setNovoTipoEsfera}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="federal">Federal</SelectItem>
                    <SelectItem value="estadual">Estadual</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Dia Padrão de Vencimento</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={novoTipoDia}
                  onChange={(e) => setNovoTipoDia(e.target.value)}
                  placeholder="20"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
                {loading ? "Salvando..." : "Adicionar Modelo"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}