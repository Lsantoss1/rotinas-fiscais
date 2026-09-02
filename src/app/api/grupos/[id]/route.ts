import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PATCH: Atualizar nome do grupo ou adicionar nova filial
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { nome_grupo, nova_filial, editar_estabelecimento } = body;

  // 1. Atualizar nome do grupo
  if (nome_grupo) {
    const { error } = await supabase
      .from("grupos")
      .update({ nome: nome_grupo })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // 2. Adicionar nova filial
  if (nova_filial) {
    const { razao_social, cnpj, regime_tributario } = nova_filial;
    if (!razao_social || !cnpj) {
      return NextResponse.json(
        { error: "Razao social e CNPJ sao obrigatorios para a nova filial." },
        { status: 400 }
      );
    }

    const { data: est, error } = await supabase
      .from("estabelecimentos")
      .insert({
        grupo_id: id,
        cnpj: cnpj.replace(/\D/g, ""),
        razao_social,
        regime_tributario: regime_tributario || "lucro_real",
        is_matriz: false,
        municipio: "Aracaju",
        uf: "SE",
        ativo: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, estabelecimento: est });
  }

  // 3. Editar estabelecimento existente
  if (editar_estabelecimento) {
    const { id: estId, razao_social, cnpj, regime_tributario } = editar_estabelecimento;
    const updateData: any = {};
    if (razao_social) updateData.razao_social = razao_social;
    if (cnpj) updateData.cnpj = cnpj.replace(/\D/g, "");
    if (regime_tributario) updateData.regime_tributario = regime_tributario;

    const { error } = await supabase
      .from("estabelecimentos")
      .update(updateData)
      .eq("id", estId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE: Desativar/Remover estabelecimento ou grupo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const estId = searchParams.get("estabelecimento_id");

  if (estId) {
    // Desativar estabelecimento específico
    const { error } = await supabase
      .from("estabelecimentos")
      .update({ ativo: false })
      .eq("id", estId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Desativar grupo inteiro
    const { error } = await supabase
      .from("grupos")
      .update({ ativo: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}