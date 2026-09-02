import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { format } from "date-fns";
import { calcularPrazo, regraVigenteParaData } from "@/lib/utils/prazo";
import type { Feriado, RegraVencimento } from "@/types/database";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  let competencia: string = "2026-09-01";
  try {
    const body = await request.json();
    if (body?.competencia) competencia = body.competencia;
  } catch {
    // usa default
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

  for (const est of estabelecimentos) {
    for (const tipo of tipos) {
      if (tipo.regime_tributario !== "todos" && tipo.regime_tributario !== est.regime_tributario) {
        continue;
      }
      if (tipo.periodicidade === "evento") continue;

      const regras: RegraVencimento[] = tipo.regras_vencimento ?? [];
      const regra = regraVigenteParaData(regras, competenciaDate);

      if (!regra) continue;

      let prazo: Date;

      if (regra.tipo_regra === "formula" && regra.formula) {
        prazo = calcularPrazo(regra.formula, regra.formula_parametro, competenciaDate, feriados as Feriado[]);
      } else if (regra.tipo_regra === "data_fixa" && regra.datas_fixas) {
        const dataFixa = regra.datas_fixas.find((d) => d >= hoje);
        if (!dataFixa) continue;
        prazo = new Date(dataFixa + "T12:00:00");
      } else {
        continue;
      }

      const prazoStr = format(prazo, "yyyy-MM-dd");

      inserts.push({
        estabelecimento_id: est.id,
        tipo_obrigacao_id: tipo.id,
        competencia: competencia,
        prazo_vencimento: prazoStr,
        prazo_vencimento_original: prazoStr,
        status: "pendente",
      });
    }
  }

  const { data, error } = await supabase
    .from("obrigacoes")
    .upsert(inserts, {
      onConflict: "estabelecimento_id,tipo_obrigacao_id,competencia",
      ignoreDuplicates: true,
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ created: data?.length ?? inserts.length, competencia });
}