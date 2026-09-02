import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// PATCH: Atualizar prazo, status, observacoes ou dados de uma obrigacao
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();
  const body = await request.json();

  const { prazo_vencimento, status, observacoes, responsavel_id } = body;
  const updateData: any = {};

  if (prazo_vencimento) updateData.prazo_vencimento = prazo_vencimento;
  if (status) updateData.status = status;
  if (observacoes !== undefined) updateData.observacoes = observacoes;
  if (responsavel_id !== undefined) updateData.responsavel_id = responsavel_id;

  const { data, error } = await supabase
    .from("obrigacoes")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, obrigacao: data });
}

// DELETE: Excluir/desativar uma obrigacao individual
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const { error } = await supabase.from("obrigacoes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}