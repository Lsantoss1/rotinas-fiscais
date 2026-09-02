"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { EsferaBadge } from "@/components/ui/EsferaBadge";
import { EditarObrigacaoExistenteModal } from "@/components/obrigacoes/EditarObrigacaoExistenteModal";
import { QuickConcluirModal } from "@/components/obrigacoes/QuickConcluirModal";
import { formatarCNPJ } from "@/lib/utils/cnpj";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  Search,
  UserCheck,
  CheckCircle2,
  Clock,
  FileSearch,
  Sparkles,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface KanbanProps {
  obrigacoes: any[];
}

const COLUMNS = [
  {
    id: "pendente",
    title: "Pendentes",
    icon: Clock,
    headerBg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/40 text-amber-800 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  {
    id: "assumida",
    title: "Em Andamento",
    icon: Sparkles,
    headerBg: "bg-sky-50 dark:bg-sky-950/30 border-sky-200/80 dark:border-sky-800/40 text-sky-800 dark:text-sky-300",
    dot: "bg-sky-500 animate-pulse",
  },
  {
    id: "em_revisao",
    title: "Em Revisão",
    icon: FileSearch,
    headerBg: "bg-purple-50 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-800/40 text-purple-800 dark:text-purple-300",
    dot: "bg-purple-500 animate-pulse",
  },
  {
    id: "entregue",
    title: "Entregues",
    icon: CheckCircle2,
    headerBg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
];

export function KanbanBoardClient({ obrigacoes: inicialObrigacoes }: KanbanProps) {
  const [obrigacoes, setObrigacoes] = useState(inicialObrigacoes);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEsfera, setFiltroEsfera] = useState("todas");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [concluirTarget, setConcluirTarget] = useState<any | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // Filtragem
  const obrigacoesFiltradas = obrigacoes.filter((o) => {
    if (filtroEsfera !== "todas" && o.tipo_obrigacao?.esfera !== filtroEsfera) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const tipo = o.tipo_obrigacao?.nome?.toLowerCase() || "";
      const grupo = o.estabelecimento?.grupo?.nome?.toLowerCase() || "";
      const empresa = o.estabelecimento?.razao_social?.toLowerCase() || "";
      const fantasia = o.estabelecimento?.nome_fantasia?.toLowerCase() || "";
      const cnpj = o.estabelecimento?.cnpj || "";
      return tipo.includes(term) || grupo.includes(term) || empresa.includes(term) || fantasia.includes(term) || cnpj.includes(term);
    }
    return true;
  });

  // Handler de Arraste
  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, colId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  }

  function handleDragLeave(e: React.DragEvent, colId: string) {
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  }

  async function handleDrop(e: React.DragEvent, targetColId: string) {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (!id) return;

    const item = obrigacoes.find((o) => o.id === id);
    if (!item || item.status === targetColId) return;

    // Se soltou em 'entregue', abre o modal de upload de comprovante
    if (targetColId === "entregue") {
      setConcluirTarget(item);
      return;
    }

    // Atualização otimista
    const prevStatus = item.status;
    setObrigacoes((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: targetColId } : o))
    );

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updateData: any = { status: targetColId };

      if (targetColId === "assumida" && !item.responsavel_id) {
        updateData.responsavel_id = user?.id || null;
        updateData.assumida_em = new Date().toISOString();
      }

      const res = await fetch(`/api/obrigacoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error("Falha ao atualizar status");
      router.refresh();
    } catch (err) {
      // Rollback se falhar
      setObrigacoes((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: prevStatus } : o))
      );
      alert("Erro ao alterar status no servidor.");
    } finally {
      setDraggedId(null);
    }
  }

  async function handleQuickAssumir(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch(`/api/obrigacoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "assumida",
          responsavel_id: user?.id || null,
        }),
      });
      if (res.ok) {
        setObrigacoes((prev) =>
          prev.map((o) =>
            o.id === id ? { ...o, status: "assumida", responsavel: { nome: user?.email?.split("@")[0] || "Você" } } : o
          )
        );
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por obrigação, empresa ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Esfera:</span>
          <Select value={filtroEsfera} onValueChange={(val) => setFiltroEsfera(val || "todas")}>
            <SelectTrigger className="h-9 text-xs w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="federal">🏛️ Federal</SelectItem>
              <SelectItem value="estadual">🗺️ Estadual</SelectItem>
              <SelectItem value="municipal">🏙️ Municipal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grade do Quadro Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const ColumnIcon = col.icon;
          const itensDaColuna = obrigacoesFiltradas.filter((o) => {
            if (col.id === "pendente") return o.status === "pendente" || o.status === "atrasada";
            return o.status === col.id;
          });

          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-2xl border p-3 min-h-[500px] flex flex-col transition-all ${
                isOver
                  ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-400/30"
                  : "border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
              }`}
            >
              {/* Header da Coluna */}
              <div className={`p-3 rounded-xl border mb-3 flex items-center justify-between shadow-xs ${col.headerBg}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <ColumnIcon className="h-4 w-4" />
                  <h3 className="font-bold text-xs uppercase tracking-wider">{col.title}</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/40">
                  {itensDaColuna.length}
                </span>
              </div>

              {/* Lista de Cartões da Coluna */}
              <div className="space-y-3 flex-1">
                {itensDaColuna.length === 0 && (
                  <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-slate-400 text-xs">
                    Nenhuma rotina nesta etapa.
                  </div>
                )}

                {itensDaColuna.map((o) => {
                  const isAtrasado = new Date(o.prazo_vencimento) < new Date() && o.status !== "entregue";
                  const empresaNome = o.estabelecimento?.nome_fantasia || o.estabelecimento?.razao_social || "";
                  const grupoNome = o.estabelecimento?.grupo?.nome || "";

                  return (
                    <div
                      key={o.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, o.id)}
                      className={`p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-3 group ${
                        draggedId === o.id ? "opacity-40 scale-95" : ""
                      } ${isAtrasado ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10" : "border-slate-200/80 dark:border-slate-800"}`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/40">
                          {grupoNome}
                        </span>
                        <EsferaBadge esfera={o.tipo_obrigacao?.esfera} />
                      </div>

                      {/* Título & Empresa */}
                      <div>
                        <Link
                          href={`/obrigacoes/${o.id}`}
                          className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1"
                        >
                          {o.tipo_obrigacao?.nome}
                        </Link>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1 mt-0.5">
                          {empresaNome}
                          {o.estabelecimento?.is_matriz && (
                            <span className="ml-1 text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold px-1 rounded">
                              MATRIZ
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {formatarCNPJ(o.estabelecimento?.cnpj || "")}
                        </p>
                      </div>

                      {/* Footer: Vencimento + Responsável */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className={`font-semibold font-mono text-[11px] ${isAtrasado ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}`}>
                            {format(new Date(o.prazo_vencimento + "T12:00:00"), "dd/MM")}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {o.responsavel?.nome ? (
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              <User className="h-3 w-3 text-indigo-500" />
                              {o.responsavel.nome.split(" ")[0]}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickAssumir(o.id)}
                              className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 border border-sky-200/60 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
                            >
                              <UserCheck className="h-3 w-3" /> Assumir
                            </button>
                          )}
                          <EditarObrigacaoExistenteModal obrigacao={o} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <QuickConcluirModal
        obrigacao={concluirTarget}
        open={!!concluirTarget}
        onOpenChange={(open) => !open && setConcluirTarget(null)}
      />
    </div>
  );
}