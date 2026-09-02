import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EsferaBadge } from "@/components/ui/EsferaBadge";

async function getObrigacoes() {
  const supabase = await createClient();
  const hoje = new Date();
  const mesAtual = format(hoje, "yyyy-MM-01");

  const { data } = await supabase
    .from("obrigacoes")
    .select(`
      id, prazo_vencimento, status, competencia, assumida_em, entregue_em,
      tipo_obrigacao:tipos_obrigacao(id, nome, esfera, periodicidade),
      estabelecimento:estabelecimentos(id, razao_social, cnpj, is_matriz, grupo:grupos(id, nome)),
      responsavel:usuarios(id, nome)
    `)
    .gte("competencia", mesAtual)
    .order("prazo_vencimento", { ascending: true })
    .limit(100);

  return data ?? [];
}

export default async function ObrigacoesPage() {
  const obrigacoes = await getObrigacoes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Obrigações Fiscais</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Todas as obrigações do período atual</p>
        </div>
      </div>

      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Obrigação</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Cliente / CNPJ</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Competência</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Vencimento</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Responsável</th>
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
                        <p className="font-medium text-slate-900 dark:text-slate-100">{o.estabelecimento?.grupo?.nome}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {o.estabelecimento?.razao_social}
                          {o.estabelecimento?.is_matriz && (
                            <span className="ml-1.5 text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold px-1 rounded">MATRIZ</span>
                          )}
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
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 text-xs">
                        {o.responsavel?.nome ? (
                          <span className="font-medium text-slate-700 dark:text-slate-300">{o.responsavel.nome}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 italic">Não atribuído</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}