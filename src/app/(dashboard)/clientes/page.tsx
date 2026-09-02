import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { formatarCNPJ } from "@/lib/utils/cnpj";
import { NovoClienteModal } from "@/components/clientes/NovoClienteModal";
import { EditarClienteModal } from "@/components/clientes/EditarClienteModal";

async function getGrupos() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("grupos")
    .select(`
      id, nome, ativo,
      estabelecimentos(id, cnpj, razao_social, nome_fantasia, is_matriz, regime_tributario, ativo)
    `)
    .eq("ativo", true)
    .order("nome");

  if (data) {
    data.forEach((g: any) => {
      if (g.estabelecimentos) {
        g.estabelecimentos = g.estabelecimentos.filter((e: any) => e.ativo);
      }
    });
  }

  return data ?? [];
}

function ordenarEstabelecimentos(list: any[]) {
  return [...list].sort((a, b) => {
    // 1. Matriz vem sempre primeiro
    if (a.is_matriz !== b.is_matriz) {
      return a.is_matriz ? -1 : 1;
    }
    // 2. Ordenação natural por razão social / nome fantasia (ex: Alpha 01, Alpha 02, Posto 4, Posto 5)
    const textA = `${a.razao_social || ""} ${a.nome_fantasia || ""}`;
    const textB = `${b.razao_social || ""} ${b.nome_fantasia || ""}`;
    return textA.localeCompare(textB, undefined, { numeric: true, sensitivity: "base" });
  });
}

const regimeLabel: Record<string, string> = {
  lucro_real: "Lucro Real",
  lucro_presumido: "Lucro Presumido",
  simples_nacional: "Simples Nacional",
};

export default async function ClientesPage() {
  const grupos = await getGrupos();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Grupos empresariais e seus estabelecimentos (Matriz e Filiais ordenadas)
          </p>
        </div>
        <NovoClienteModal />
      </div>

      <div className="grid gap-4">
        {grupos.length === 0 && (
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="py-12 text-center">
              <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">Nenhum cliente cadastrado ainda.</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 mb-4">
                Clique em "Novo Cliente" acima para cadastrar seu primeiro cliente.
              </p>
            </CardContent>
          </Card>
        )}
        {grupos.map((grupo: any) => {
          const estabelecimentosOrdenados = ordenarEstabelecimentos(grupo.estabelecimentos || []);

          return (
            <Card key={grupo.id} className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 dark:bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                      <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{grupo.nome}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {estabelecimentosOrdenados.length} estabelecimento(s)
                      </p>
                    </div>
                  </div>
                  <EditarClienteModal grupo={grupo} />
                </div>
                <div className="grid gap-2">
                  {estabelecimentosOrdenados.map((est: any) => (
                    <div
                      key={est.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                        est.is_matriz
                          ? "border-indigo-200/80 bg-indigo-50/40 dark:border-indigo-900/50 dark:bg-indigo-950/20"
                          : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          {est.razao_social}
                          {est.nome_fantasia && (
                            <span className="text-xs text-slate-500 font-normal">({est.nome_fantasia})</span>
                          )}
                          {est.is_matriz && (
                            <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded tracking-wide">
                              MATRIZ
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {formatarCNPJ(est.cnpj)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium px-2 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                          {regimeLabel[est.regime_tributario] || est.regime_tributario}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}