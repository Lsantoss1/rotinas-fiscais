import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { ObrigacaoAcoes } from "@/components/obrigacoes/ObrigacaoAcoes";
import { AnexosList } from "@/components/obrigacoes/AnexosList";
import { HistoricoList } from "@/components/obrigacoes/HistoricoList";
import { EditarObrigacaoExistenteModal } from "@/components/obrigacoes/EditarObrigacaoExistenteModal";
import { ArrowLeft, Building2, Calendar, User } from "lucide-react";
import Link from "next/link";
import { formatarCNPJ } from "@/lib/utils/cnpj";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EsferaBadge } from "@/components/ui/EsferaBadge";

export default async function ObrigacaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: obrigacao } = await supabase
    .from("obrigacoes")
    .select(
      "*, tipo_obrigacao:tipos_obrigacao(*), estabelecimento:estabelecimentos(*, grupo:grupos(*)), responsavel:usuarios!obrigacoes_responsavel_id_fkey(id, nome, email), anexos(*)"
    )
    .eq("id", id)
    .single();

  if (!obrigacao) notFound();

  const { data: historico } = await supabase
    .from("obrigacoes_historico")
    .select("*, responsavel:usuarios(nome)")
    .eq("obrigacao_id", id)
    .order("criado_em", { ascending: false });

  const isAtrasada =
    new Date(obrigacao.prazo_vencimento) < new Date() &&
    obrigacao.status !== "entregue";

  const esfera = (obrigacao.tipo_obrigacao as any)?.esfera ?? "federal";
  const tipoNome = (obrigacao.tipo_obrigacao as any)?.nome ?? "";
  const grupoNome = (obrigacao.estabelecimento as any)?.grupo?.nome ?? "";
  const estNome = (obrigacao.estabelecimento as any)?.razao_social ?? "";
  const nomeFantasia = (obrigacao.estabelecimento as any)?.nome_fantasia ?? "";
  const cnpj = (obrigacao.estabelecimento as any)?.cnpj ?? "";
  const respNome = (obrigacao.responsavel as any)?.nome;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/obrigacoes"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{tipoNome}</h1>
            <p className="text-sm text-slate-500">{grupoNome} • {estNome} {nomeFantasia ? `(${nomeFantasia})` : ""}</p>
          </div>
        </div>

        <EditarObrigacaoExistenteModal
          obrigacao={obrigacao as any}
          triggerClassName="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={obrigacao.status} />
              <EsferaBadge esfera={esfera} />
              {isAtrasada && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                  EM ATRASO
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm pt-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Competência</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                    {obrigacao.competencia
                      ? format(
                          new Date(obrigacao.competencia + "T12:00:00"),
                          "MM/yyyy"
                        )
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Prazo de Vencimento</p>
                  <p
                    className={`font-semibold font-mono ${
                      isAtrasada ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {format(
                      new Date(obrigacao.prazo_vencimento + "T12:00:00"),
                      "dd/MM/yyyy"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Estabelecimento</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{estNome}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    {formatarCNPJ(cnpj)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Responsável</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {respNome ?? "Não atribuído"}
                  </p>
                </div>
              </div>
            </div>

            {obrigacao.observacoes && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Observações / Notas</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{obrigacao.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <ObrigacaoAcoes
            obrigacao={obrigacao as any}
            currentUserId={user?.id ?? ""}
          />
        </div>
      </div>

      <AnexosList
        obrigacaoId={id}
        anexos={(obrigacao.anexos as any[]) ?? []}
      />
      <HistoricoList historico={historico ?? []} />
    </div>
  );
}