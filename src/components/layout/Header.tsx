import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'

async function getAlertasCount(userId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('alertas')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', userId)
    .eq('lido', false)
  return count ?? 0
}

export async function Header({ userName }: { userName: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const alertasCount = user ? await getAlertasCount(user.id) : 0

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div />
      <div className="flex items-center gap-4">
        <div className="relative">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
            <Bell className="h-5 w-5 text-gray-600" />
            {alertasCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {alertasCount > 9 ? '9+' : alertasCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 rounded-full h-8 w-8 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">{userName}</span>
        </div>
      </div>
    </header>
  )
}
