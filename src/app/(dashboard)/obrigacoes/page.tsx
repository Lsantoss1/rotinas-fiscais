import { createClient } from "@/lib/supabase/server";
import { ObrigacoesMainView } from "@/components/obrigacoes/ObrigacoesMainView";

async function getObrigacoes() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("obrigacoes")
    .select(`
      id, prazo_vencimento, status, competencia, observacoes, assumida_em, entregue_em, responsavel_id,
      tipo_obrigacao:tipos_obrigacao(id, nome, esfera, periodicidade),
      estabelecimento:estabelecimentos(id, razao_social, nome_fantasia, cnpj, is_matriz, grupo:grupos(id, nome)),
      responsavel:usuarios(id, nome)
    `)
    .order("prazo_vencimento", { ascending: true });

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

  return <ObrigacoesMainView obrigacoes={obrigacoes} estabelecimentos={estabelecimentos} />;
}