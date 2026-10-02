// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam credenciais do Supabase. Verifique .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Função helper para verificar se usuário está autenticado
export async function getSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Erro ao buscar sessão:', error)
    return null
  }
}

// Função helper para fazer login
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    return { data: null, error }
  }
}

// Função helper para fazer logout
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
    return { error }
  }
}

// Função helper para registrar novo usuário
export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  } catch (error) {
    console.error('Erro ao registrar:', error)
    return { data: null, error }
  }
}

// Função helper para buscar usuário atual com dados do banco
export async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) return null

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('Erro ao buscar usuário:', error)
      return null
    }

    return userData
  } catch (error) {
    console.error('Erro em getCurrentUser:', error)
    return null
  }
}
