import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { format, addDays } from "date-fns";

export async function POST() {
  const supabase = await createClient();
  const hoje = new Date();
  const hojeStr = format(hoje, "yyyy-MM-dd");
  const em3dias = format(addDays(hoje, 3), "yyyy-MM-dd");
  const em10dias = format(addDays(hoje, 10), "yyyy-MM-dd");

  const { data: usuarios } = await supabase.from("usuarios").select("id").eq("ativo", true);
  if (!usuarios) return NextResponse.json({ ok: true });

  // Obrigacoes vencendo
  const { data: obrigacoes } = await supabase
    .from("obrigacoes")
    .select("id, prazo_vencimento, tipo_obrigacao:tipos_obrigacao(nome), estabelecimento:estabelecimentos(razao_social)")
    .in("status", ["pendente", "assumida"])
    .lte("prazo_vencimento", em10dias);

  if (!obrigacoes) return NextResponse.json({ ok: true });

  const inserts: any[] = [];

  for (const usuario of usuarios) {
    for (const o of obrigacoes) {
      const prazo = o.prazo_vencimento;
      let tipo: string;

      if (prazo < hojeStr) {
        tipo = "atrasado";
      } else if (prazo === hojeStr) {
        tipo = "prazo_hoje";
      } else if (prazo <= em3dias) {
        tipo = "prazo_3d";
      } else {
        tipo = "prazo_10d";
      }

      const mensagem = `${(o.tipo_obrigacao as any)?.nome} - ${(o.estabelecimento as any)?.razao_social} vence em ${prazo}`;

      inserts.push({
        usuario_id: usuario.id,
        obrigacao_id: o.id,
        tipo,
        mensagem,
        lido: false,
      });
    }
  }

  if (inserts.length > 0) {
    await supabase.from("alertas").upsert(inserts, {
      onConflict: "usuario_id,obrigacao_id,tipo",
      ignoreDuplicates: true,
    });
  }

  return NextResponse.json({ generated: inserts.length });
}
