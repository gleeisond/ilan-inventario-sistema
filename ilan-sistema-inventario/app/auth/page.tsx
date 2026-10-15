'use client'
// app/auth/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DEMO_MODE, getSupabase } from '@/lib/supabase'

const inputClass =
  'w-full rounded-md border border-linha bg-white px-3 py-2 text-sm text-tinta outline-none transition focus:border-tinta focus:ring-2 focus:ring-ouro/40'

export default function Auth() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const supabase = getSupabase()
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setMessage({ kind: 'error', text: 'E-mail ou senha incorretos.' })
        else if (data.session) router.push('/equipamentos')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setMessage({ kind: 'error', text: error.message })
        else {
          setMessage({
            kind: 'ok',
            text: 'Conta criada. Confirme o e-mail e peça ao administrador para liberar o seu acesso.',
          })
          setPassword('')
        }
      }
    } catch {
      setMessage({ kind: 'error', text: 'Não foi possível entrar agora. Tente de novo.' })
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grafite p-4">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marca/genesis41-logo-horizontal-negativo.svg" alt="Genesis41" className="mx-auto mb-8 h-8 w-auto" />
        <div className="rounded-lg bg-papel p-7">
          {DEMO_MODE ? (
            <div className="flex flex-col gap-4 text-sm text-tinta">
              <h1 className="font-display text-xl font-bold">Modo demonstração</h1>
              <p className="text-cinza">
                O banco de dados ainda não foi configurado, então o sistema abre com dados de exemplo e sem login.
              </p>
              <Link href="/equipamentos" className="rounded-md bg-grafite px-4 py-2.5 text-center font-semibold text-nevoa">
                Entrar na demonstração
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-xl font-bold text-tinta">{mode === 'login' ? 'Entrar' : 'Criar conta'}</h1>
              <form onSubmit={handleAuth} className="mt-5 flex flex-col gap-4">
                <label className="flex flex-col gap-1 text-sm font-medium text-tinta">
                  E-mail
                  <input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-tinta">
                  Senha
                  <input
                    id="senha"
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className={inputClass}
                  />
                </label>
                {message && (
                  <p
                    role={message.kind === 'error' ? 'alert' : 'status'}
                    className={`rounded-md p-3 text-sm ${message.kind === 'error' ? 'bg-[#FBEDE9] text-[#8A2E1C]' : 'bg-[#E9F4EE] text-[#1F5A40]'}`}
                  >
                    {message.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-grafite px-4 py-2.5 text-sm font-semibold text-nevoa transition hover:bg-black disabled:opacity-60"
                >
                  {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              </form>
              <p className="mt-5 text-center text-sm text-cinza">
                {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login')
                    setMessage(null)
                  }}
                  className="font-semibold text-tinta underline"
                >
                  {mode === 'login' ? 'Criar conta' : 'Entrar'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
