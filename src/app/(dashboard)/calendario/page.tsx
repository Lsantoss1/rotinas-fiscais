import { createClient } from "@/lib/supabase/server";
import { CalendarioClient } from "@/components/calendario/CalendarioClient";

async function getObrigacoes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("obrigacoes")
    .select(`
      id, prazo_vencimento, status, competencia,
      tipo_obrigacao:tipos_obrigacao(id, nome, esfera),
      estabelecimento:estabelecimentos(id, razao_social, cnpj, grupo:grupos(id, nome))
    `)
    .order("prazo_vencimento", { ascending: true });

  return data ?? [];
}

async function getFeriados() {
  const supabase = await createClient();
  const { data } = await supabase.from("feriados").select("*");
  return data ?? [];
}

export default async function CalendarioPage() {
  const [obrigacoes, feriados] = await Promise.all([
    getObrigacoes(),
    getFeriados(),
  ]);

  return <CalendarioClient obrigacoesIniciais={obrigacoes as any[]} feriados={feriados} />;
}