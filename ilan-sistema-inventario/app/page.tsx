'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient, Session } from '@supabase/supabase-js'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default function Home() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)

      // Se não tem sessão, redireciona pro login
      if (!session) {
        router.push('/auth')
      } else {
        // Se tem sessão, redireciona pro dashboard
        router.push('/dashboard')
      }
    })
  }, [router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8 bg-gray-50">
          <h1 className="text-4xl font-bold mb-4">ILAN Inventário</h1>
          <p className="text-gray-600 text-lg">Sistema de Gerenciamento de Equipamentos de Mídia</p>
          <div className="mt-8">
            <p className="text-gray-500">Navegue através do menu lateral para acessar os módulos do sistema.</p>
          </div>
        </main>
      </div>
    </div>
  )
}