// lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

// Cria o cliente só no primeiro uso, para o build não exigir as variáveis do Supabase
export function getSupabase() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltam credenciais do Supabase. Verifique .env.local')
  }

  client = createClient(supabaseUrl, supabaseAnonKey, {
    // O Next 14 guarda em cache os fetch GET do servidor (inclusive dentro de server actions),
    // o que faria as telas e ações lerem dados antigos do banco
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
  return client
}

// Cliente com a chave service_role (só no servidor). Necessário para criar e alterar senhas de acesso.
let adminClient: SupabaseClient | null = null
export function getSupabaseAdmin() {
  if (adminClient) return adminClient
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Falta a variável SUPABASE_SERVICE_ROLE_KEY na Vercel para gerenciar senhas.')
  }
  adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
  return adminClient
}

// Cliente só para conferir usuário e senha. Novo a cada uso (a sessão não fica guardada no servidor)
// e sem cache: o Next 14 também guarda POST do servidor, e uma senha antiga continuaria valendo.
export function criarClienteLogin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
}

export const supabase = new Proxy({} as SupabaseClient, {
  get: (_, prop) => Reflect.get(getSupabase(), prop),
})

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
