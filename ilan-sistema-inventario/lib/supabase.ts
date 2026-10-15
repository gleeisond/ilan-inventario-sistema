// lib/supabase.ts
// Cliente único do Supabase para o navegador. A sessão do usuário fica no navegador,
// então as consultas protegidas por RLS precisam sair daqui, e não de server actions.
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Sem credenciais (ou com NEXT_PUBLIC_DEMO_MODE=true) o sistema roda em modo demonstração,
// com dados de exemplo guardados só no navegador.
export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !supabaseUrl || !supabaseAnonKey

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (DEMO_MODE) {
    throw new Error('Supabase não configurado: o sistema está em modo demonstração.')
  }
  if (!client) {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string)
  }
  return client
}

export async function signOut() {
  if (DEMO_MODE) return { error: null }
  const { error } = await getSupabase().auth.signOut()
  return { error }
}
