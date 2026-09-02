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
import { Edit2, Plus, Trash2, Building2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatarCNPJ } from "@/lib/utils/cnpj";

interface EstabelecimentoData {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  is_matriz: boolean;
  regime_tributario: string;
}

interface GrupoData {
  id: string;
  nome: string;
  estabelecimentos: EstabelecimentoData[];
}

function ordenarEstabelecimentos(list: EstabelecimentoData[]) {
  return [...list].sort((a, b) => {
    if (a.is_matriz !== b.is_matriz) {
      return a.is_matriz ? -1 : 1;
    }
    const textA = `${a.razao_social || ""} ${a.nome_fantasia || ""}`;
    const textB = `${b.razao_social || ""} ${b.nome_fantasia || ""}`;
    return textA.localeCompare(textB, undefined, { numeric: true, sensitivity: "base" });
  });
}

export function EditarClienteModal({ grupo }: { grupo: GrupoData }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [nomeGrupo, setNomeGrupo] = useState(grupo.nome);

  // Nova filial formulário
  const [showAddFilial, setShowAddFilial] = useState(false);
  const [novaFilialRazao, setNovaFilialRazao] = useState("");
  const [novaFilialCnpj, setNovaFilialCnpj] = useState("");

  // Estabelecimento editando
  const [editingEstId, setEditingEstId] = useState<string | null>(null);
  const [editRazao, setEditRazao] = useState("");
  const [editCnpj, setEditCnpj] = useState("");

  const matriz = grupo.estabelecimentos?.find((e) => e.is_matriz);
  const regimePadrao = matriz?.regime_tributario || "lucro_real";
  const estabelecimentosOrdenados = ordenarEstabelecimentos(grupo.estabelecimentos || []);

  async function handleUpdateNomeGrupo() {
    if (!nomeGrupo.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/grupos/${grupo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome_grupo: nomeGrupo }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar nome do grupo");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFilial(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!novaFilialRazao.trim() || !novaFilialCnpj.trim()) {
      setError("Preencha a razão social e CNPJ da nova filial.");
      return;
    }

    const cleanCnpj = novaFilialCnpj.replace(/\D/g, "");
    if (cleanCnpj.length !== 14) {
      setError("CNPJ deve possuir 14 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/grupos/${grupo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nova_filial: {
            razao_social: novaFilialRazao,
            cnpj: cleanCnpj,
            regime_tributario: regimePadrao,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao adicionar filial");

      setNovaFilialRazao("");
      setNovaFilialCnpj("");
      setShowAddFilial(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEditingEst(est: EstabelecimentoData) {
    setEditingEstId(est.id);
    setEditRazao(est.razao_social);
    setEditCnpj(formatarCNPJ(est.cnpj));
  }

  async function handleSaveEst(estId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/grupos/${grupo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editar_estabelecimento: {
            id: estId,
            razao_social: editRazao,
            cnpj: editCnpj.replace(/\D/g, ""),
          },
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar alterações do estabelecimento");
      setEditingEstId(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDesativarEst(estId: string, razao: string) {
    if (!confirm(`Deseja realmente remover/desativar a empresa "${razao}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/grupos/${grupo.id}?estabelecimento_id=${estId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao desativar estabelecimento");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer">
        <Edit2 className="h-3.5 w-3.5" /> Editar / Filiais
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" /> Editar Cliente / Gerenciar Filiais
          </DialogTitle>
          <DialogDescription>
            Altere informações do grupo empresarial ou inclua novas filiais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {error && (
            <div className="bg-rose-50 text-rose-700 text-sm p-3 rounded-md border border-rose-200">
              {error}
            </div>
          )}

          {/* Nome do Grupo */}
          <div className="space-y-1.5">
            <Label htmlFor="nomeGrupoEdit">Nome do Grupo Empresarial</Label>
            <div className="flex gap-2">
              <Input
                id="nomeGrupoEdit"
                value={nomeGrupo}
                onChange={(e) => setNomeGrupo(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUpdateNomeGrupo}
                disabled={loading || nomeGrupo === grupo.nome}
              >
                Atualizar
              </Button>
            </div>
          </div>

          {/* Lista de Estabelecimentos Existentes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Estabelecimentos Cadastrados ({estabelecimentosOrdenados.length})
              </h4>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowAddFilial(!showAddFilial)}
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Nova Filial
              </Button>
            </div>

            {/* Formulário de Adicionar Nova Filial */}
            {showAddFilial && (
              <form onSubmit={handleAddFilial} className="p-4 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                  + Nova Filial
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Razão Social *</Label>
                    <Input
                      placeholder="Razão social da filial"
                      value={novaFilialRazao}
                      onChange={(e) => setNovaFilialRazao(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CNPJ *</Label>
                    <Input
                      placeholder="00.000.000/0002-00"
                      value={novaFilialCnpj}
                      onChange={(e) => setNovaFilialCnpj(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddFilial(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={loading}
                  >
                    Salvar Filial
                  </Button>
                </div>
              </form>
            )}

            {/* Lista dos Estabelecimentos */}
            <div className="space-y-2">
              {estabelecimentosOrdenados.map((est) => {
                const isEditing = editingEstId === est.id;
                return (
                  <div
                    key={est.id}
                    className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      est.is_matriz
                        ? "border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input
                            value={editRazao}
                            onChange={(e) => setEditRazao(e.target.value)}
                            placeholder="Razão Social"
                          />
                          <Input
                            value={editCnpj}
                            onChange={(e) => setEditCnpj(e.target.value)}
                            placeholder="CNPJ"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingEstId(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSaveEst(est.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <Check className="h-3.5 w-3.5" /> Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            {est.razao_social}
                            {est.is_matriz && (
                              <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">
                                MATRIZ
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {formatarCNPJ(est.cnpj)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingEst(est)}
                            className="h-8 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Editar
                          </Button>
                          {!est.is_matriz && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDesativarEst(est.id, est.razao_social)}
                              className="h-8 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Excluir
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}