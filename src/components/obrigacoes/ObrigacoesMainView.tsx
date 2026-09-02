"use client";

import { useState } from "react";
import { ObrigacoesTableClient } from "@/components/obrigacoes/ObrigacoesTableClient";
import { KanbanBoardClient } from "@/components/obrigacoes/KanbanBoardClient";
import { GerenciarObrigacoesModal } from "@/components/obrigacoes/GerenciarObrigacoesModal";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, List } from "lucide-react";

export function ObrigacoesMainView({
  obrigacoes,
  estabelecimentos,
}: {
  obrigacoes: any[];
  estabelecimentos: any[];
}) {
  const [viewMode, setViewMode] = useState<"tabela" | "kanban">("kanban"); // Default Kanban for modern experience

  return (
    <div className="space-y-6">
      {/* Header com Titulo, Alternador de Visao e Modal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Obrigações Fiscais
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Gerenciamento de rotinas em tempo real (Competência 08/2026 e 09/2026)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Alternador de Visao Tabela / Kanban */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Quadro Kanban
            </button>
            <button
              onClick={() => setViewMode("tabela")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "tabela"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <List className="h-3.5 w-3.5" /> Visão Tabela
            </button>
          </div>

          <GerenciarObrigacoesModal estabelecimentos={estabelecimentos} />
        </div>
      </div>

      {/* Conteudo Principal */}
      {viewMode === "kanban" ? (
        <KanbanBoardClient obrigacoes={obrigacoes} />
      ) : (
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <ObrigacoesTableClient obrigacoes={obrigacoes} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}