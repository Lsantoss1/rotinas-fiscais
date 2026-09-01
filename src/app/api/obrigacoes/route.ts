import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { format, addMonths } from "date-fns";
import { calcularPrazo, regraVigenteParaData } from "@/lib/utils/prazo";
import type { Feriado, RegraVencimento } from "@/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { competencia } = await request.json();

  if (!competencia) {
    return NextResponse.json({ error: "competencia required (YYYY-MM-DD)" }, { status: 400 });
  }

  const competenciaDate = new Date(competencia + "T12:00:00");

  const [{ data: feriados }, { data: tipos }, { data: estabelecimentos }] = await Promise.all([
    supabase.from("feriados").select("*"),
    supabase.from("tipos_obrigacao")
      .select("*, regras_vencimento(*)")
      .eq("ativo", true),
    supabase.from("estabelecimentos")
      .select("*, grupo:grupos(*)")
      .eq("ativo", true),
  ]);

  if (!feriados || !tipos || !estabelecimentos) {
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }

  const inserts: any[] = [];
  const hoje = format(new Date(), "yyyy-MM-dd");

  for (const estabelecimento of estabelecimentos) {
    for (const tipo of tipos) {
      // Verificar regime tributario
      if (tipo.regime_tributario !== "todos" && tipo.regime_tributario !== estabelecimento.regime_tributario) {
        continue;
      }

      // Pular periodicidade evento (deve ser criado manualmente)
      if (tipo.periodicidade === "evento") continue;

      // Encontrar regra vigente
      const regras: RegraVencimento[] = tipo.regras_vencimento ?? [];
      const regra = regraVigenteParaData(regras, competenciaDate);

      if (!regra) continue;

      let prazo: Date;

      if (regra.tipo_regra === "formula" && regra.formula) {
        prazo = calcularPrazo(regra.formula, regra.formula_parametro, competenciaDate, feriados as Feriado[]);
      } else if (regra.tipo_regra === "data_fixa" && regra.datas_fixas) {
        // Para parcelas, usa a primeira data fixa disponivel
        const dataFixa = regra.datas_fixas.find(d => d >= hoje);
        if (!dataFixa) continue;
        prazo = new Date(dataFixa + "T12:00:00");
      } else {
        continue;
      }

      const prazoStr = format(prazo, "yyyy-MM-dd");

      inserts.push({
        estabelecimento_id: estabelecimento.id,
        tipo_obrigacao_id: tipo.id,
        competencia: competencia,
        prazo_vencimento: prazoStr,
        prazo_vencimento_original: prazoStr,
        status: "pendente",
      });
    }
  }

  // Upsert (ignora se ja existe para essa combinacao)
  const { data, error } = await supabase
    .from("obrigacoes")
    .upsert(inserts, {
      onConflict: "estabelecimento_id,tipo_obrigacao_id,competencia",
      ignoreDuplicates: true,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ created: inserts.length, competencia });
}
