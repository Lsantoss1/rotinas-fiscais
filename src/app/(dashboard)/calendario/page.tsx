import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getObrigacoesDoMes() {
  const supabase = await createClient();
  const hoje = new Date();
  const inicio = format(startOfMonth(hoje), "yyyy-MM-dd");
  const fim = format(endOfMonth(hoje), "yyyy-MM-dd");

  const { data } = await supabase
    .from("obrigacoes")
    .select("id, prazo_vencimento, status, tipo_obrigacao:tipos_obrigacao(nome, esfera)")
    .gte("prazo_vencimento", inicio)
    .lte("prazo_vencimento", fim)
    .order("prazo_vencimento");

  return data ?? [];
}

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-400",
  assumida: "bg-blue-400",
  entregue: "bg-green-400",
  atrasada: "bg-red-400",
};

export default async function CalendarioPage() {
  const hoje = new Date();
  const obrigacoes = await getObrigacoesDoMes();
  const inicio = startOfMonth(hoje);
  const fim = endOfMonth(hoje);
  const dias = eachDayOfInterval({ start: inicio, end: fim });
  const primeiroDia = getDay(inicio);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(hoje, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: primeiroDia }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {dias.map(dia => {
              const obsDia = obrigacoes.filter(o =>
                isSameDay(new Date(o.prazo_vencimento + "T12:00:00"), dia)
              );
              return (
                <div
                  key={dia.toISOString()}
                  className={`min-h-16 p-1.5 rounded-lg border text-xs ${
                    isToday(dia) ? "border-blue-400 bg-blue-50" : "border-gray-100"
                  }`}
                >
                  <span className={`font-medium ${isToday(dia) ? "text-blue-700" : "text-gray-700"}`}>
                    {format(dia, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {obsDia.slice(0, 3).map((o: any) => (
                      <div
                        key={o.id}
                        className={`${statusColors[o.status]} rounded px-1 py-0.5 text-white text-[10px] truncate`}
                        title={o.tipo_obrigacao?.nome}
                      >
                        {o.tipo_obrigacao?.nome}
                      </div>
                    ))}
                    {obsDia.length > 3 && (
                      <div className="text-gray-400 text-[10px]">+{obsDia.length - 3} mais</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Pendente</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Em andamento</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> Entregue</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Atrasado</span>
      </div>
    </div>
  );
}
