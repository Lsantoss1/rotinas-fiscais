import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { GerenciarObrigacoesModal } from "@/components/obrigacoes/GerenciarObrigacoesModal";
import { ObrigacoesTableClient } from "@/components/obrigacoes/ObrigacoesTableClient";

async function getObrigacoes() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("obrigacoes")
    .select(`
      id, prazo_vencimento, status, competencia, observacoes, assumida_em, entregue_em,
      tipo_obrigacao:tipos_obrigacao(id, nome, esfera, periodicidade),
      estabelecimento:estabelecimentos(id, razao_social, nome_fantasia, cnpj, is_matriz, grupo:grupos(id, nome)),
      responsavel:usuarios(id, nome)
    `)
    .order("prazo_vencimento", { ascending: true })
    .limit(150);

  return data ?? [];
}

async function getEstabelecimentos() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("estabelecimentos")
    .select("id, razao_social, nome_fantasia, cnpj, is_matriz, grupo:grupos(nome)")
    .eq("ativo", true)
    .order("razao_social");

  if (data) {
    data.sort((a: any, b: any) => {
      if (a.is_matriz !== b.is_matriz) return a.is_matriz ? -1 : 1;
      const textA = `${a.razao_social || ""} ${a.nome_fantasia || ""}`;
      const textB = `${b.razao_social || ""} ${b.nome_fantasia || ""}`;
      return textA.localeCompare(textB, undefined, { numeric: true, sensitivity: "base" });
    });
  }

  return data ?? [];
}

export default async function ObrigacoesPage() {
  const [obrigacoes, estabelecimentos] = await Promise.all([
    getObrigacoes(),
    getEstabelecimentos(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Obrigações Fiscais
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Acompanhamento dinâmico, ações rápidas e controle de entregas (Competência 08/2026 e 09/2026)
          </p>
        </div>
        <GerenciarObrigacoesModal estabelecimentos={estabelecimentos} />
      </div>

      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <ObrigacoesTableClient obrigacoes={obrigacoes} />
        </CardContent>
      </Card>
    </div>
  );
}