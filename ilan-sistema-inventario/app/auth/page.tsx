'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default function Auth() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) {
          setError(authError.message)
          setLoading(false)
          return
        }

        if (data.session) {
          router.push('/dashboard')
        }
      } else {
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signupError) {
          setError(signupError.message)
          setLoading(false)
          return
        }

        setError('Conta criada! Verifique seu email para confirmar.')
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setError('Erro ao autenticar. Tente novamente.')
      console.error(err)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">ILAN Inventário</h1>
            <p className="text-gray-600 mt-2">Sistema de Gerenciamento de Equipamentos</p>
          </div>

          {/* Tab */}
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 font-semibold text-center transition ${
                mode === 'login'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 font-semibold text-center transition ${
                mode === 'signup'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cadastro
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@ilan.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Error */}
            {error && (
              <div className={`p-3 rounded-lg text-sm ${
                error.includes('criada')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition mt-6"
            >
              {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-600 text-sm mt-6">
            {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
            </button>
          </p>
        </div>

        {/* Demo Info */}
        <div className="mt-6 bg-white bg-opacity-80 rounded-lg p-4 text-center text-sm text-gray-600">
          <p className="font-semibold mb-2">Contas de Teste:</p>
          <p>Email: gleison@ilan.com</p>
          <p className="text-xs mt-1">(Crie a conta no Supabase primeiro)</p>
        </div>
      </div>
    </div>
  )
}