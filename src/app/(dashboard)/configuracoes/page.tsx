import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Settings, Calendar, Bell, Building } from 'lucide-react'

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie regras, prazos e cadastros do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg"><Building className="h-5 w-5 text-blue-600" /></div>
              <div>
                <CardTitle className="text-base">Tipos de Obrigação</CardTitle>
                <CardDescription>Cadastre e gerencie obrigações fiscais</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg"><Calendar className="h-5 w-5 text-purple-600" /></div>
              <div>
                <CardTitle className="text-base">Regras de Vencimento</CardTitle>
                <CardDescription>Formulas e datas por portaria/decreto</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg"><Calendar className="h-5 w-5 text-green-600" /></div>
              <div>
                <CardTitle className="text-base">Feriados</CardTitle>
                <CardDescription>Federal, estadual SE e municipal Aracaju</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg"><Bell className="h-5 w-5 text-orange-600" /></div>
              <div>
                <CardTitle className="text-base">Alertas</CardTitle>
                <CardDescription>Configurar antecedência dos avisos de prazo</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
