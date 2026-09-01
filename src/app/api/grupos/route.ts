import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { nome_grupo, estabelecimentos } = body;

  if (!nome_grupo || !estabelecimentos || !Array.isArray(estabelecimentos) || estabelecimentos.length === 0) {
    return NextResponse.json(
      { error: "Nome do grupo e pelo menos um estabelecimento sao obrigatorios." },
      { status: 400 }
    );
  }

  // 1. Criar o Grupo
  const { data: grupo, error: grupoError } = await supabase
    .from("grupos")
    .insert({ nome: nome_grupo, ativo: true })
    .select()
    .single();

  if (grupoError || !grupo) {
    return NextResponse.json({ error: grupoError?.message || "Erro ao criar grupo" }, { status: 500 });
  }

  // 2. Mapear estabelecimentos
  const estInserts = estabelecimentos.map((est: any, index: number) => ({
    grupo_id: grupo.id,
    cnpj: est.cnpj.replace(/\D/g, ""),
    razao_social: est.razao_social,
    nome_fantasia: est.nome_fantasia || null,
    regime_tributario: est.regime_tributario || "lucro_real",
    is_matriz: est.is_matriz ?? (index === 0),
    municipio: est.municipio || "Aracaju",
    uf: est.uf || "SE",
    ativo: true,
  }));

  const { data: estabs, error: estError } = await supabase
    .from("estabelecimentos")
    .insert(estInserts)
    .select();

  if (estError) {
    // Reverter grupo se falhar
    await supabase.from("grupos").delete().eq("id", grupo.id);
    return NextResponse.json({ error: estError.message }, { status: 500 });
  }

  return NextResponse.json({ grupo, estabelecimentos: estabs });
}