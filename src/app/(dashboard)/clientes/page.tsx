import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { formatarCNPJ } from "@/lib/utils/cnpj";
import { NovoClienteModal } from "@/components/clientes/NovoClienteModal";

async function getGrupos() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("grupos")
    .select(`
      id, nome, ativo,
      estabelecimentos(id, cnpj, razao_social, is_matriz, regime_tributario, ativo)
    `)
    .eq("ativo", true)
    .order("nome");
  return data ?? [];
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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Grupos empresariais e seus estabelecimentos (Matriz e Filiais)
          </p>
        </div>
        <NovoClienteModal />
      </div>

      <div className="grid gap-4">
        {grupos.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Nenhum cliente cadastrado ainda.</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                Clique em "Novo Cliente" acima para cadastrar seu primeiro cliente.
              </p>
            </CardContent>
          </Card>
        )}
        {grupos.map((grupo: any) => (
          <Card key={grupo.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{grupo.nome}</h3>
                    <p className="text-xs text-gray-500">
                      {grupo.estabelecimentos?.length ?? 0} estabelecimento(s)
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                {grupo.estabelecimentos
                  ?.sort((a: any, b: any) => b.is_matriz - a.is_matriz)
                  .map((est: any) => (
                    <div
                      key={est.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        est.is_matriz
                          ? "border-blue-200 bg-blue-50/60"
                          : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {est.razao_social}
                          {est.is_matriz && (
                            <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">
                              MATRIZ
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {formatarCNPJ(est.cnpj)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {regimeLabel[est.regime_tributario] || est.regime_tributario}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}