import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Clock, XCircle, ChevronRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EsferaBadge } from "@/components/ui/EsferaBadge";

async function getStats() {
  const supabase = await createClient();
  const hoje = new Date();
  const inicio = format(startOfMonth(hoje), "yyyy-MM-dd");
  const fim = format(endOfMonth(hoje), "yyyy-MM-dd");

  const [pendentes, assumidas, entregues, atrasadas] = await Promise.all([
    supabase.from("obrigacoes").select("*", { count: "exact", head: true }).eq("status", "pendente").gte("prazo_vencimento", inicio).lte("prazo_vencimento", fim),
    supabase.from("obrigacoes").select("*", { count: "exact", head: true }).eq("status", "assumida"),
    supabase.from("obrigacoes").select("*", { count: "exact", head: true }).eq("status", "entregue").gte("entregue_em", inicio),
    supabase.from("obrigacoes").select("*", { count: "exact", head: true }).eq("status", "atrasada"),
  ]);

  return {
    pendentes: pendentes.count ?? 0,
    assumidas: assumidas.count ?? 0,
    entregues: entregues.count ?? 0,
    atrasadas: atrasadas.count ?? 0,
  };
}

async function getProximasObrigacoes() {
  const supabase = await createClient();
  const hoje = format(new Date(), "yyyy-MM-dd");
  const em10dias = format(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

  const { data } = await supabase
    .from("obrigacoes")
    .select(`
      id, prazo_vencimento, status,
      tipo_obrigacao:tipos_obrigacao(nome, esfera),
      estabelecimento:estabelecimentos(razao_social, cnpj, grupo:grupos(nome))
    `)
    .in("status", ["pendente", "assumida"])
    .gte("prazo_vencimento", hoje)
    .lte("prazo_vencimento", em10dias)
    .order("prazo_vencimento", { ascending: true })
    .limit(10);

  return data ?? [];
}

async function getAtrasadas() {
  const supabase = await createClient();
  const hoje = format(new Date(), "yyyy-MM-dd");

  const { data } = await supabase
    .from("obrigacoes")
    .select(`
      id, prazo_vencimento, status,
      tipo_obrigacao:tipos_obrigacao(nome, esfera),
      estabelecimento:estabelecimentos(razao_social, cnpj, grupo:grupos(nome))
    `)
    .in("status", ["pendente", "assumida"])
    .lt("prazo_vencimento", hoje)
    .order("prazo_vencimento", { ascending: true })
    .limit(10);

  return data ?? [];
}

export default async function DashboardPage() {
  const [stats, proximas, atrasadas] = await Promise.all([
    getStats(),
    getProximasObrigacoes(),
    getAtrasadas(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Painel Geral</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/obrigacoes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Ver todas as obrigações <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pendentes (mês)</p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stats.pendentes}</p>
              </div>
              <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-2xl">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Em Andamento</p>
                <p className="text-3xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">{stats.assumidas}</p>
              </div>
              <div className="bg-sky-500/10 text-sky-600 dark:text-sky-400 p-3 rounded-2xl">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entregues (mês)</p>
                <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{stats.entregues}</p>
              </div>
              <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-2xl">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Atrasadas</p>
                <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{stats.atrasadas}</p>
              </div>
              <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3 rounded-2xl">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vencendo nos próximos 10 dias */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <CardTitle className="text-base font-semibold flex items-center justify-between text-slate-900 dark:text-slate-100">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Vencendo nos próximos 10 dias
              </span>
              <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {proximas.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {proximas.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Nenhuma obrigação vencendo em breve. ✨
              </div>
            ) : (
              <div className="space-y-2.5">
                {proximas.map((o: any) => (
                  <Link key={o.id} href={`/obrigacoes/${o.id}`} className="block group">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {o.tipo_obrigacao?.nome}
                          </span>
                          <EsferaBadge esfera={o.tipo_obrigacao?.esfera} />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {o.estabelecimento?.grupo?.nome} • <span className="font-medium">{o.estabelecimento?.razao_social}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0 ml-3 flex flex-col items-end gap-1">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/40">
                          {format(new Date(o.prazo_vencimento + "T12:00:00"), "dd/MM")}
                        </span>
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Obrigações em Atraso */}
        <Card className="border border-rose-200/80 dark:border-rose-900/50 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="border-b border-rose-100 dark:border-rose-900/30 pb-4 bg-rose-50/40 dark:bg-rose-950/20">
            <CardTitle className="text-base font-semibold flex items-center justify-between text-rose-900 dark:text-rose-200">
              <span className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-500" />
                Em Atraso URGENTE
              </span>
              <span className="text-xs font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full">
                {atrasadas.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {atrasadas.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Nenhuma obrigação em atraso! 🎉
              </div>
            ) : (
              <div className="space-y-2.5">
                {atrasadas.map((o: any) => (
                  <Link key={o.id} href={`/obrigacoes/${o.id}`} className="block group">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-rose-600 transition-colors">
                            {o.tipo_obrigacao?.nome}
                          </span>
                          <EsferaBadge esfera={o.tipo_obrigacao?.esfera} />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {o.estabelecimento?.grupo?.nome} • <span className="font-medium">{o.estabelecimento?.razao_social}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0 ml-3 flex flex-col items-end gap-1">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded-md">
                          Venceu {format(new Date(o.prazo_vencimento + "T12:00:00"), "dd/MM")}
                        </span>
                        <StatusBadge status="atrasada" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}