import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { ObrigacaoAcoes } from "@/components/obrigacoes/ObrigacaoAcoes";
import { AnexosList } from "@/components/obrigacoes/AnexosList";
import { HistoricoList } from "@/components/obrigacoes/HistoricoList";
import { ArrowLeft, Building2, Calendar, User } from "lucide-react";
import Link from "next/link";
import { formatarCNPJ } from "@/lib/utils/cnpj";
import { cn } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  assumida: "Em andamento",
  entregue: "Entregue",
  atrasada: "Atrasada",
};

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  assumida: "bg-blue-100 text-blue-800",
  entregue: "bg-green-100 text-green-800",
  atrasada: "bg-red-100 text-red-800",
};

const esferaColors: Record<string, string> = {
  federal: "bg-blue-50 text-blue-700",
  estadual: "bg-purple-50 text-purple-700",
  municipal: "bg-green-50 text-green-700",
};

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
  const cnpj = (obrigacao.estabelecimento as any)?.cnpj ?? "";
  const respNome = (obrigacao.responsavel as any)?.nome;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/obrigacoes"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{tipoNome}</h1>
          <p className="text-sm text-gray-500">{grupoNome}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "text-xs px-2 py-1 rounded-full font-medium",
                  statusColors[obrigacao.status]
                )}
              >
                {statusLabel[obrigacao.status]}
              </span>
              <span
                className={cn(
                  "text-xs px-2 py-1 rounded-full font-medium",
                  esferaColors[esfera]
                )}
              >
                {esfera}
              </span>
              {isAtrasada && (
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-800">
                  EM ATRASO
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Competencia</p>
                  <p className="font-medium">
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
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Vencimento</p>
                  <p
                    className={cn(
                      "font-medium",
                      isAtrasada && "text-red-600"
                    )}
                  >
                    {format(
                      new Date(obrigacao.prazo_vencimento + "T12:00:00"),
                      "dd/MM/yyyy"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Estabelecimento</p>
                  <p className="font-medium">{estNome}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {formatarCNPJ(cnpj)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Responsavel</p>
                  <p className="font-medium">
                    {respNome ?? "Nao atribuido"}
                  </p>
                </div>
              </div>
            </div>
            {obrigacao.observacoes && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Observacoes</p>
                <p className="text-sm text-gray-700">{obrigacao.observacoes}</p>
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