"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EsferaBadge } from "@/components/ui/EsferaBadge";
import { EditarObrigacaoExistenteModal } from "@/components/obrigacoes/EditarObrigacaoExistenteModal";
import { QuickConcluirModal } from "@/components/obrigacoes/QuickConcluirModal";
import { formatarCNPJ } from "@/lib/utils/cnpj";
import { Button } from "@/components/ui/button";
import { CheckCircle2, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function ObrigacoesTableClient({ obrigacoes }: { obrigacoes: any[] }) {
  const [concluirTarget, setConcluirTarget] = useState<any | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleAssumir(id: string) {
    setLoadingId(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("obrigacoes")
        .update({
          status: "assumida",
          responsavel_id: user?.id || null,
          assumida_em: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      alert("Erro ao assumir obrigação: " + err.message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40">
              <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Obrigação</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Cliente / Empresa</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Competência</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Vencimento</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Status</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Ações Rápidas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {obrigacoes.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  Nenhuma obrigação encontrada para este período.
                </td>
              </tr>
            )}
            {obrigacoes.map((o: any) => {
              const isAtrasado = new Date(o.prazo_vencimento) < new Date() && o.status !== "entregue";
              const empresaNomeExibicao = `${o.estabelecimento?.razao_social}${o.estabelecimento?.nome_fantasia ? ` (${o.estabelecimento.nome_fantasia})` : ""}`;

              return (
                <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="space-y-1">
                      <Link href={`/obrigacoes/${o.id}`} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {o.tipo_obrigacao?.nome}
                      </Link>
                      <div>
                        <EsferaBadge esfera={o.tipo_obrigacao?.esfera} />
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{o.estabelecimento?.grupo?.nome}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {empresaNomeExibicao}
                      {o.estabelecimento?.is_matriz && (
                        <span className="ml-1.5 text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold px-1 rounded">MATRIZ</span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      CNPJ: {formatarCNPJ(o.estabelecimento?.cnpj || "")}
                    </p>
                  </td>

                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 text-xs font-mono">
                    {o.competencia ? format(new Date(o.competencia + "T12:00:00"), "MM/yyyy") : "-"}
                  </td>

                  <td className="px-5 py-3.5">
                    <span className={`font-semibold text-xs px-2 py-0.5 rounded ${
                      isAtrasado
                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                        : "text-slate-800 dark:text-slate-200"
                    }`}>
                      {format(new Date(o.prazo_vencimento + "T12:00:00"), "dd/MM/yyyy")}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <StatusBadge status={o.status} />
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Botão Assumir */}
                      {o.status === "pendente" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssumir(o.id)}
                          disabled={loadingId === o.id}
                          className="h-7 text-xs font-semibold text-sky-700 dark:text-sky-300 border-sky-200 bg-sky-50/50 hover:bg-sky-100 gap-1"
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Assumir
                        </Button>
                      )}

                      {/* Botão Concluir */}
                      {o.status !== "entregue" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setConcluirTarget(o)}
                          className="h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                        </Button>
                      )}

                      {/* Editar & Detalhes */}
                      <EditarObrigacaoExistenteModal obrigacao={o} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <QuickConcluirModal
        obrigacao={concluirTarget}
        open={!!concluirTarget}
        onOpenChange={(open) => !open && setConcluirTarget(null)}
      />
    </>
  );
}