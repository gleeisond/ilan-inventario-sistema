// lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

// Cliente dos dados. Todas as consultas rodam no servidor (páginas e server actions), e quem
// está logado é conferido pelo cookie de sessão próprio (lib/sessao.ts), não pelo Supabase Auth.
// Por isso o servidor usa a chave service_role: assim o banco pode recusar todo acesso feito
// com a chave pública (anon), que fica exposta no navegador.
// Sem a service_role configurada, cai para a anon, para o sistema não parar enquanto a
// variável não estiver na Vercel (nesse caso o banco precisa continuar liberando a anon).
// Cria o cliente só no primeiro uso, para o build não exigir as variáveis do Supabase
export function getSupabase() {
  if (client) return client
  if (typeof window !== 'undefined') {
    throw new Error('getSupabase() só pode ser usado no servidor.')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !key) {
    throw new Error('Faltam credenciais do Supabase. Verifique .env.local')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY ausente: consultando o banco com a chave anon.')
  }

  client = createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
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
