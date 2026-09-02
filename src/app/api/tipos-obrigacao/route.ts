import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tipos_obrigacao")
    .select("*, regras_vencimento(*)")
    .order("nome");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tipos: data });
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();

  const { nome, descricao, esfera, regime_tributario, periodicidade, dia_vencimento } = body;

  if (!nome || !esfera) {
    return NextResponse.json({ error: "Nome e Esfera sao obrigatorios." }, { status: 400 });
  }

  // 1. Criar TipoObrigacao
  const { data: tipo, error: tErr } = await supabase
    .from("tipos_obrigacao")
    .insert({
      nome,
      descricao: descricao || null,
      esfera,
      regime_tributario: regime_tributario || "todos",
      periodicidade: periodicidade || "mensal",
      requer_consolidacao_matriz: false,
      ativo: true,
    })
    .select()
    .single();

  if (tErr || !tipo) {
    return NextResponse.json({ error: tErr?.message || "Erro ao criar tipo" }, { status: 500 });
  }

  // 2. Criar RegraVencimento inicial
  const dia = dia_vencimento ? parseInt(dia_vencimento) : 20;
  await supabase.from("regras_vencimento").insert({
    tipo_obrigacao_id: tipo.id,
    valida_de: "2024-01-01",
    tipo_regra: "formula",
    formula: "dia_N_mes_seguinte",
    formula_parametro: dia,
    motivo: "Cadastro inicial do tipo de obrigacao",
  });

  return NextResponse.json({ tipo });
}

export async function DELETE(request: Request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Desativar
  const { error } = await supabase.from("tipos_obrigacao").update({ ativo: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}