"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EsferaBadge } from "@/components/ui/EsferaBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

interface ObrigacaoItem {
  id: string;
  prazo_vencimento: string;
  status: string;
  competencia: string;
  tipo_obrigacao: {
    nome: string;
    esfera: string;
  };
  estabelecimento: {
    razao_social: string;
    cnpj: string;
    grupo: {
      nome: string;
    };
  };
}

export function CalendarioClient({
  obrigacoesIniciais,
  feriados,
}: {
  obrigacoesIniciais: ObrigacaoItem[];
  feriados: any[];
}) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1));
  const [filtroEsfera, setFiltroEsfera] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);

  function prevMonth() {
    setCurrentDate(subMonths(currentDate, 1));
  }

  function nextMonth() {
    setCurrentDate(addMonths(currentDate, 1));
  }

  function goToday() {
    setCurrentDate(new Date(2026, 7, 1));
  }

  const inicioMes = startOfMonth(currentDate);
  const fimMes = endOfMonth(currentDate);
  const diasDoMes = eachDayOfInterval({ start: inicioMes, end: fimMes });
  const primeiroDiaSemana = getDay(inicioMes);

  const obrigaçoesFiltradas = obrigacoesIniciais.filter((o) => {
    if (filtroEsfera !== "todas" && o.tipo_obrigacao?.esfera !== filtroEsfera) return false;
    if (filtroStatus !== "todos" && o.status !== filtroStatus) return false;
    return true;
  });

  const obrigaçoesDoDiaModal = diaSelecionado
    ? obrigaçoesFiltradas.filter((o) =>
        isSameDay(parseISO(o.prazo_vencimento), diaSelecionado)
      )
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
            <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 capitalize">
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calendário de Vencimentos e Apurações (Competência 08/2026)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs font-semibold">
            Mês Atual (08/2026)
          </Button>
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-0.5">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold px-2 capitalize text-slate-700 dark:text-slate-200">
              {format(currentDate, "MMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Filter className="h-3.5 w-3.5" /> Filtros:
        </div>

        <Select value={filtroEsfera} onValueChange={(val) => setFiltroEsfera(val || "todas")}>
          <SelectTrigger className="h-8 text-xs w-[140px]">
            <SelectValue placeholder="Esfera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Esferas</SelectItem>
            <SelectItem value="federal">🏛️ Federal</SelectItem>
            <SelectItem value="estadual">🗺️ Estadual (SE)</SelectItem>
            <SelectItem value="municipal">🏙️ Municipal (Aju)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroStatus} onValueChange={(val) => setFiltroStatus(val || "todos")}>
          <SelectTrigger className="h-8 text-xs w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="pendente">🟡 Pendentes</SelectItem>
            <SelectItem value="assumida">🔷 Em Andamento</SelectItem>
            <SelectItem value="entregue">🟢 Entregues</SelectItem>
            <SelectItem value="atrasada">🔴 Atrasadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <CardContent className="p-3">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((dia, idx) => (
              <div
                key={dia}
                className={`text-center text-xs font-semibold py-2 rounded-lg ${
                  idx === 0 || idx === 6
                    ? "text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/30 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-100 dark:border-slate-900" />
            ))}

            {diasDoMes.map((dia) => {
              const diaStr = format(dia, "yyyy-MM-dd");
              const feriado = feriados?.find((f) => f.data === diaStr);
              const obrigaçoesDoDia = obrigaçoesFiltradas.filter((o) =>
                isSameDay(parseISO(o.prazo_vencimento), dia)
              );
              const isFimDeSemana = getDay(dia) === 0 || getDay(dia) === 6;

              return (
                <div
                  key={dia.toISOString()}
                  onClick={() => setDiaSelecionado(dia)}
                  className={`min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer hover:shadow-sm ${
                    isToday(dia)
                      ? "border-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 dark:border-indigo-800"
                      : isFimDeSemana
                      ? "bg-slate-50/60 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800/60"
                      : feriado
                      ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40"
                      : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center ${
                        isToday(dia)
                          ? "bg-indigo-600 text-white"
                          : isFimDeSemana
                          ? "text-slate-400 dark:text-slate-500"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {format(dia, "d")}
                    </span>

                    {feriado && (
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded truncate max-w-[80px]" title={feriado.descricao}>
                        {feriado.descricao}
                      </span>
                    )}
                  </div>

                  <div className="my-1 space-y-1 overflow-hidden">
                    {obrigaçoesDoDia.slice(0, 2).map((o) => (
                      <div
                        key={o.id}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center justify-between border truncate ${
                          o.status === "entregue"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 text-emerald-800 dark:text-emerald-300"
                            : o.status === "assumida"
                            ? "bg-sky-50 dark:bg-sky-950/60 border-sky-200 text-sky-800 dark:text-sky-300"
                            : o.status === "atrasada"
                            ? "bg-rose-50 dark:bg-rose-950/60 border-rose-200 text-rose-800 dark:text-rose-300"
                            : "bg-amber-50 dark:bg-amber-950/60 border-amber-200 text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        <span className="truncate">{o.tipo_obrigacao?.nome}</span>
                      </div>
                    ))}

                    {obrigaçoesDoDia.length > 2 && (
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 pt-0.5">
                        +{obrigaçoesDoDia.length - 2} mais...
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    {obrigaçoesDoDia.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {obrigaçoesDoDia.length} item(ns)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!diaSelecionado} onOpenChange={(open) => !open && setDiaSelecionado(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-600" />
              Obrigações de {diaSelecionado ? format(diaSelecionado, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {obrigaçoesDoDiaModal.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                Nenhuma obrigação agendada para este dia.
              </p>
            ) : (
              obrigaçoesDoDiaModal.map((o) => (
                <div
                  key={o.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/obrigacoes/${o.id}`}
                        className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors"
                      >
                        {o.tipo_obrigacao?.nome}
                      </Link>
                      <EsferaBadge esfera={o.tipo_obrigacao?.esfera} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {o.estabelecimento?.grupo?.nome} • {o.estabelecimento?.razao_social}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={o.status} />
                    <Link
                      href={`/obrigacoes/${o.id}`}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Abrir detalhe →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}