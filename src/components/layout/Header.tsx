import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

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
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10 transition-colors">
      <div />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        
        <div className="relative">
          <button className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
            <Bell className="h-5 w-5" />
            {alertasCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[11px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {alertasCount > 9 ? '9+' : alertasCount}
              </span>
            )}
          </button>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-full h-8 w-8 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-semibold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{userName}</span>
        </div>
      </div>
    </header>
  )
}