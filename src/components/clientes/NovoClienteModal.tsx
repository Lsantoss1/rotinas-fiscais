"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface FilialForm {
  razao_social: string;
  cnpj: string;
}

export function NovoClienteModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [nomeGrupo, setNomeGrupo] = useState("");
  const [matrizRazao, setMatrizRazao] = useState("");
  const [matrizCnpj, setMatrizCnpj] = useState("");
  const [regime, setRegime] = useState("lucro_real");
  const [filiais, setFiliais] = useState<FilialForm[]>([]);

  function addFilial() {
    setFiliais([...filiais, { razao_social: "", cnpj: "" }]);
  }

  function removeFilial(index: number) {
    setFiliais(filiais.filter((_, i) => i !== index));
  }

  function updateFilial(index: number, field: keyof FilialForm, value: string) {
    const next = [...filiais];
    next[index][field] = value;
    setFiliais(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nomeGrupo.trim() || !matrizRazao.trim() || !matrizCnpj.trim()) {
      setError("Preencha o nome do grupo e os dados da matriz.");
      return;
    }

    const cleanMatrizCnpj = matrizCnpj.replace(/\D/g, "");
    if (cleanMatrizCnpj.length !== 14) {
      setError("CNPJ da matriz deve conter 14 dígitos.");
      return;
    }

    for (let i = 0; i < filiais.length; i++) {
      const f = filiais[i];
      if (!f.razao_social.trim() || !f.cnpj.trim()) {
        setError(`Preencha a razão social e CNPJ da filial ${i + 1}.`);
        return;
      }
      if (f.cnpj.replace(/\D/g, "").length !== 14) {
        setError(`CNPJ da filial ${i + 1} deve conter 14 dígitos.`);
        return;
      }
    }

    setLoading(true);

    const estabelecimentos = [
      {
        razao_social: matrizRazao,
        cnpj: cleanMatrizCnpj,
        regime_tributario: regime,
        is_matriz: true,
      },
      ...filiais.map((f) => ({
        razao_social: f.razao_social,
        cnpj: f.cnpj.replace(/\D/g, ""),
        regime_tributario: regime,
        is_matriz: false,
      })),
    ];

    try {
      const res = await fetch("/api/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_grupo: nomeGrupo,
          estabelecimentos,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao cadastrar cliente");
      }

      setNomeGrupo("");
      setMatrizRazao("");
      setMatrizCnpj("");
      setFiliais([]);
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm h-9 px-4 py-2 rounded-md shadow transition-colors cursor-pointer">
        <Plus className="h-4 w-4" /> Novo Cliente
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" /> Cadastrar Novo Cliente
          </DialogTitle>
          <DialogDescription>
            Cadastre um Grupo Empresarial e seus estabelecimentos (Matriz e Filiais).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="nomeGrupo">Nome do Grupo Empresarial *</Label>
            <Input
              id="nomeGrupo"
              placeholder="Ex: Grupo Mármores & Granitos"
              value={nomeGrupo}
              onChange={(e) => setNomeGrupo(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Regime Tributário do Grupo</Label>
            <Select value={regime} onValueChange={(val) => setRegime(val || "lucro_real")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lucro_real">Lucro Real</SelectItem>
                <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border border-blue-200 bg-blue-50/50 p-4 rounded-lg space-y-3">
            <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">MATRIZ</span>
              Dados da Matriz
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="matrizRazao" className="text-xs">Razão Social *</Label>
                <Input
                  id="matrizRazao"
                  placeholder="Razão social da matriz"
                  value={matrizRazao}
                  onChange={(e) => setMatrizRazao(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="matrizCnpj" className="text-xs">CNPJ da Matriz *</Label>
                <Input
                  id="matrizCnpj"
                  placeholder="00.000.000/0001-00"
                  value={matrizCnpj}
                  onChange={(e) => setMatrizCnpj(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                Filiais ({filiais.length})
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFilial}
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Filial
              </Button>
            </div>

            {filiais.map((filial, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50/50 space-y-2 relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500">Filial #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilial(index)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Razão Social</Label>
                    <Input
                      placeholder="Razão social da filial"
                      value={filial.razao_social}
                      onChange={(e) => updateFilial(index, "razao_social", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CNPJ</Label>
                    <Input
                      placeholder="00.000.000/0002-00"
                      value={filial.cnpj}
                      onChange={(e) => updateFilial(index, "cnpj", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}