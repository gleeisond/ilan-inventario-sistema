'use client'
// lib/profile.tsx
// Carrega quem está usando o sistema (sessão + linha na tabela users) e
// manda para o login quem não estiver autenticado.
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DEMO_MODE, getSupabase } from '@/lib/supabase'
import type { User } from '@/types/database'
import { DEMO_PROFILE_ID, loadDemo } from '@/lib/equipamentos/demo'

type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; profile: User }
  | { status: 'inactive'; email: string }
  | { status: 'error'; message: string }

const ProfileContext = createContext<User | null>(null)

export function useProfile(): User {
  const profile = useContext(ProfileContext)
  if (!profile) throw new Error('useProfile precisa estar dentro de ProfileProvider')
  return profile
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<ProfileState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (DEMO_MODE) {
        const demoUser = loadDemo().users.find(u => u.id === DEMO_PROFILE_ID)
        if (!cancelled && demoUser) setState({ status: 'ready', profile: demoUser })
        return
      }
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/auth')
        return
      }
      const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle()
      if (cancelled) return
      if (error) setState({ status: 'error', message: 'Não foi possível carregar o seu usuário. Tente recarregar a página.' })
      else if (!data || !data.is_active) setState({ status: 'inactive', email: session.user.email ?? '' })
      else setState({ status: 'ready', profile: data as User })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [router])

  if (state.status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-papel text-sm text-cinza">Carregando…</div>
  }
  if (state.status === 'inactive' || state.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-papel p-6">
        <div className="max-w-md rounded-lg border border-linha bg-white p-8">
          <h1 className="font-display text-xl font-bold text-tinta">
            {state.status === 'inactive' ? 'Seu acesso ainda não foi liberado' : 'Algo deu errado'}
          </h1>
          <p className="mt-3 text-sm text-cinza">
            {state.status === 'inactive'
              ? `A conta ${state.email} existe, mas ainda não tem perfil ativo no sistema. Peça ao administrador para liberar o seu acesso e definir o seu campus.`
              : state.message}
          </p>
        </div>
      </div>
    )
  }
  return <ProfileContext.Provider value={state.profile}>{children}</ProfileContext.Provider>
}
