"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { EsferaBadge } from "@/components/ui/EsferaBadge";
import { EditarObrigacaoExistenteModal } from "@/components/obrigacoes/EditarObrigacaoExistenteModal";
import { QuickConcluirModal } from "@/components/obrigacoes/QuickConcluirModal";
import { formatarCNPJ, formatarNomeEmpresa } from "@/lib/utils/cnpj";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Search,
  UserCheck,
  CheckCircle2,
  Clock,
  FileSearch,
  Sparkles,
  User,
  Building2,
  Layers,
  GripVertical,
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

function sortCardItens(itens: any[]) {
  return [...itens].sort((a, b) => {
    const isMatrizA = a.estabelecimento?.is_matriz ? 1 : 0;
    const isMatrizB = b.estabelecimento?.is_matriz ? 1 : 0;
    if (isMatrizA !== isMatrizB) return isMatrizB - isMatrizA;

    // Ordenar pelo CNPJ para garantir a sequência natural 0001, 0002, 0003... 0010
    const cnpjA = a.estabelecimento?.cnpj || "";
    const cnpjB = b.estabelecimento?.cnpj || "";
    return cnpjA.localeCompare(cnpjB, undefined, { numeric: true });
  });
}

export function KanbanBoardClient({ obrigacoes: inicialObrigacoes }: KanbanProps) {
  const [obrigacoes, setObrigacoes] = useState(inicialObrigacoes);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEsfera, setFiltroEsfera] = useState("todas");
  const [filtroGrupo, setFiltroGrupo] = useState("todos");
  const [filtroCompetencia, setFiltroCompetencia] = useState("2026-08-01"); // Padrão 08/2026
  const [modoAgrupado, setModoAgrupado] = useState(true);
  const [selectedEstByCard, setSelectedEstByCard] = useState<Record<string, string>>({});

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [concluirTarget, setConcluirTarget] = useState<any | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // Lista de competencias disponiveis
  const competenciasDisponiveis = useMemo(() => {
    const setComp = new Set<string>();
    obrigacoes.forEach((o) => {
      if (o.competencia) setComp.add(o.competencia);
    });
    return Array.from(setComp).sort();
  }, [obrigacoes]);

  // Lista de grupos unicos
  const gruposUnicos = useMemo(() => {
    const setGrupos = new Set<string>();
    obrigacoes.forEach((o) => {
      const gNome = o.estabelecimento?.grupo?.nome;
      if (gNome) setGrupos.add(gNome);
    });
    return Array.from(setGrupos).sort();
  }, [obrigacoes]);

  // Filtragem
  const obrigacoesFiltradas = useMemo(() => {
    return obrigacoes.filter((o) => {
      if (filtroCompetencia !== "todas" && o.competencia !== filtroCompetencia) return false;
      if (filtroEsfera !== "todas" && o.tipo_obrigacao?.esfera !== filtroEsfera) return false;
      if (filtroGrupo !== "todos" && o.estabelecimento?.grupo?.nome !== filtroGrupo) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const tipo = o.tipo_obrigacao?.nome?.toLowerCase() || "";
        const grupo = o.estabelecimento?.grupo?.nome?.toLowerCase() || "";
        const empresa = o.estabelecimento?.razao_social?.toLowerCase() || "";
        const fantasia = o.estabelecimento?.nome_fantasia?.toLowerCase() || "";
        const cnpj = o.estabelecimento?.cnpj || "";
        return (
          tipo.includes(term) ||
          grupo.includes(term) ||
          empresa.includes(term) ||
          fantasia.includes(term) ||
          cnpj.includes(term)
        );
      }
      return true;
    });
  }, [obrigacoes, filtroCompetencia, filtroEsfera, filtroGrupo, searchTerm]);

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

    await handleMudarStatus(id, targetColId);
    setDraggedId(null);
  }

  async function handleMudarStatus(id: string, targetColId: string) {
    const item = obrigacoes.find((o) => o.id === id);
    if (!item || item.status === targetColId) return;

    if (targetColId === "entregue") {
      setConcluirTarget(item);
      return;
    }

    const prevStatus = item.status;
    setObrigacoes((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: targetColId } : o))
    );

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      setObrigacoes((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: prevStatus } : o))
      );
      alert("Erro ao alterar status no servidor.");
    }
  }

  async function handleQuickAssumir(id: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
            o.id === id
              ? {
                  ...o,
                  status: "assumida",
                  responsavel: {
                    nome: user?.email?.split("@")[0] || "Você",
                  },
                }
              : o
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full lg:w-72">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por obrigação, empresa ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro de Competencia */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Competência:</span>
            <Select value={filtroCompetencia} onValueChange={(val) => setFiltroCompetencia(val || "2026-08-01")}>
              <SelectTrigger className="h-9 text-xs w-[130px] font-bold text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {competenciasDisponiveis.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs font-semibold">
                    {format(new Date(c + "T12:00:00"), "MM/yyyy")} {c === "2026-08-01" ? "(Atual)" : ""}
                  </SelectItem>
                ))}
                <SelectItem value="todas" className="text-xs font-semibold">Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Grupo */}
          {gruposUnicos.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Grupo:</span>
              <Select value={filtroGrupo} onValueChange={(val) => setFiltroGrupo(val || "todos")}>
                <SelectTrigger className="h-9 text-xs w-[135px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Grupos</SelectItem>
                  {gruposUnicos.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtro de Esfera */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Esfera:</span>
            <Select value={filtroEsfera} onValueChange={(val) => setFiltroEsfera(val || "todas")}>
              <SelectTrigger className="h-9 text-xs w-[125px]">
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

          {/* Alternador de Agrupamento */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setModoAgrupado(true)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                modoAgrupado
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Agrupar por obrigação e selecionar a empresa dentro do card"
            >
              <Layers className="h-3.5 w-3.5" /> Agrupado
            </button>
            <button
              type="button"
              onClick={() => setModoAgrupado(false)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                !modoAgrupado
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Exibir 1 card por empresa/filial individualmente"
            >
              Individual
            </button>
          </div>
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

          // Agrupamento por Obrigação + Grupo + Competência
          const gruposCards = useMemo(() => {
            if (!modoAgrupado) return null;

            const map: Record<string, {
              key: string;
              tipo_obrigacao: any;
              grupo: any;
              competencia: string;
              itens: any[];
            }> = {};

            itensDaColuna.forEach((item) => {
              const grupoId = item.estabelecimento?.grupo?.id || item.estabelecimento?.grupo?.nome || "default";
              const tipoId = item.tipo_obrigacao?.id || item.tipo_obrigacao?.nome || "tipo";
              const comp = item.competencia || "geral";
              const key = `${tipoId}_${grupoId}_${comp}`;

              if (!map[key]) {
                map[key] = {
                  key,
                  tipo_obrigacao: item.tipo_obrigacao,
                  grupo: item.estabelecimento?.grupo,
                  competencia: comp,
                  itens: [],
                };
              }
              map[key].itens.push(item);
            });

            return Object.values(map).map((group) => ({
              ...group,
              itens: sortCardItens(group.itens),
            }));
          }, [itensDaColuna, modoAgrupado]);

          const totalContagem = itensDaColuna.length;
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
                <div className="flex items-center gap-1.5">
                  {modoAgrupado && gruposCards && (
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {gruposCards.length} obrig. •
                    </span>
                  )}
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/40">
                    {totalContagem}
                  </span>
                </div>
              </div>

              {/* Lista de Cartões da Coluna */}
              <div className="space-y-3 flex-1">
                {totalContagem === 0 && (
                  <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-slate-400 text-xs">
                    Nenhuma rotina nesta etapa.
                  </div>
                )}

                {/* MODO AGRUPADO POR OBRIGAÇÃO */}
                {modoAgrupado && gruposCards
                  ? gruposCards.map((card) => {
                      const cardKey = `${col.id}_${card.key}`;
                      const selectedId = selectedEstByCard[cardKey] || card.itens[0]?.id;
                      const activeItem = card.itens.find((i) => i.id === selectedId) || card.itens[0];

                      if (!activeItem) return null;

                      const isAtrasado =
                        new Date(activeItem.prazo_vencimento) < new Date() && activeItem.status !== "entregue";
                      const grupoNome = card.grupo?.nome || activeItem.estabelecimento?.grupo?.nome || "";
                      const totalFiliais = card.itens.length;
                      const compFormatada = card.competencia ? format(new Date(card.competencia + "T12:00:00"), "MM/yyyy") : "";

                      // Nome formatado Alpha 01, Alpha 02, etc.
                      const activeInfo = formatarNomeEmpresa(activeItem.estabelecimento);

                      return (
                        <div
                          key={cardKey}
                          draggable
                          onDragStart={(e) => handleDragStart(e, activeItem.id)}
                          className={`p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all space-y-3 group ${
                            draggedId === activeItem.id ? "opacity-40 scale-95" : ""
                          } ${
                            isAtrasado
                              ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
                              : "border-slate-200/80 dark:border-slate-800"
                          }`}
                        >
                          {/* Top Badges & Total de Empresas */}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/40">
                                {grupoNome}
                              </span>
                              <EsferaBadge esfera={card.tipo_obrigacao?.esfera} />
                              {compFormatada && (
                                <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {compFormatada}
                                </span>
                              )}
                            </div>

                            <span
                              className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 px-2 py-0.5 rounded-full flex items-center gap-1"
                              title={`${totalFiliais} empresas cadastradas para esta obrigação`}
                            >
                              <Building2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                              {totalFiliais} {totalFiliais === 1 ? "empresa" : "empresas"}
                            </span>
                          </div>

                          {/* Título da Obrigação */}
                          <div>
                            <Link
                              href={`/obrigacoes/${activeItem.id}`}
                              className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 flex items-center gap-1"
                            >
                              <GripVertical className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 cursor-grab shrink-0" />
                              {card.tipo_obrigacao?.nome}
                            </Link>
                          </div>

                          {/* Seletor da Empresa Dentro do Card */}
                          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-indigo-500" />
                                Empresa / Filial:
                              </span>
                              {activeItem.estabelecimento?.is_matriz && (
                                <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">
                                  MATRIZ
                                </span>
                              )}
                            </div>

                            <Select
                              value={activeItem.id}
                              onValueChange={(val) => {
                                if (val) {
                                  setSelectedEstByCard((prev) => ({
                                    ...prev,
                                    [cardKey]: val,
                                  }));
                                }
                              }}
                            >
                              {/* Trigger sem UUID! Mostra diretamente o nome formatado */}
                              <SelectTrigger className="h-auto py-1.5 text-xs bg-white dark:bg-slate-900 font-semibold w-full border-slate-300 dark:border-slate-700">
                                <div className="flex items-center gap-1.5 truncate text-left mr-1 flex-1">
                                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                                    {activeInfo.labelDestaque}
                                  </span>
                                </div>
                              </SelectTrigger>

                              {/* Dropdown Amplo Horizontalmente com layout de 2 linhas */}
                              <SelectContent
                                alignItemWithTrigger={false}
                                className="w-auto min-w-[360px] sm:min-w-[430px] max-w-[95vw] p-1.5 max-h-[340px]"
                              >
                                {card.itens.map((it) => {
                                  const info = formatarNomeEmpresa(it.estabelecimento);
                                  return (
                                    <SelectItem
                                      key={it.id}
                                      value={it.id}
                                      className="text-xs py-2 px-2.5 cursor-pointer rounded-lg hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40"
                                    >
                                      <div className="flex flex-col text-left w-full pr-2">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-bold text-slate-900 dark:text-slate-100">
                                            {info.labelDestaque}
                                          </span>
                                          {it.estabelecimento?.is_matriz && (
                                            <span className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold px-1 rounded">
                                              MATRIZ
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                          {info.subtitulo}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>

                            {/* Detalhes da empresa selecionada (completo sem corte) */}
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                              <p className="font-medium text-slate-700 dark:text-slate-300 truncate" title={activeItem.estabelecimento?.razao_social}>
                                {activeItem.estabelecimento?.razao_social}
                              </p>
                              <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                                CNPJ: {formatarCNPJ(activeItem.estabelecimento?.cnpj || "")}
                              </p>
                            </div>
                          </div>

                          {/* Footer: Vencimento + Responsável + Ações */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span
                                className={`font-semibold font-mono text-[11px] ${
                                  isAtrasado ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {format(new Date(activeItem.prazo_vencimento + "T12:00:00"), "dd/MM")}
                              </span>
                              {isAtrasado && (
                                <span className="text-[9px] bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-bold px-1 rounded">
                                  ATRASO
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {activeItem.responsavel?.nome ? (
                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  <User className="h-3 w-3 text-indigo-500" />
                                  {activeItem.responsavel.nome.split(" ")[0]}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleQuickAssumir(activeItem.id)}
                                  className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 border border-sky-200/60 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
                                >
                                  <UserCheck className="h-3 w-3" /> Assumir
                                </button>
                              )}

                              {activeItem.status !== "entregue" && (
                                <button
                                  type="button"
                                  onClick={() => setConcluirTarget(activeItem)}
                                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200/60 px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5"
                                  title="Concluir e anexar comprovante desta filial"
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Concluir
                                </button>
                              )}

                              <EditarObrigacaoExistenteModal obrigacao={activeItem} />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  : /* MODO INDIVIDUAL */
                    itensDaColuna.map((o) => {
                      const isAtrasado =
                        new Date(o.prazo_vencimento) < new Date() && o.status !== "entregue";
                      const grupoNome = o.estabelecimento?.grupo?.nome || "";
                      const info = formatarNomeEmpresa(o.estabelecimento);

                      return (
                        <div
                          key={o.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, o.id)}
                          className={`p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-3 group ${
                            draggedId === o.id ? "opacity-40 scale-95" : ""
                          } ${
                            isAtrasado
                              ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10"
                              : "border-slate-200/80 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/40">
                              {grupoNome}
                            </span>
                            <EsferaBadge esfera={o.tipo_obrigacao?.esfera} />
                          </div>

                          <div>
                            <Link
                              href={`/obrigacoes/${o.id}`}
                              className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1"
                            >
                              {o.tipo_obrigacao?.nome}
                            </Link>
                            <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold line-clamp-1 mt-0.5">
                              {info.labelDestaque}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {info.subtitulo}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span
                                className={`font-semibold font-mono text-[11px] ${
                                  isAtrasado
                                    ? "text-rose-600 dark:text-rose-400 font-bold"
                                    : "text-slate-700 dark:text-slate-300"
                                }`}
                              >
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
