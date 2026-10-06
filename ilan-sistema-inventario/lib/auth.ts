// lib/auth.ts
// Usuário logado e registro de atividades (só no servidor)

import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase'
import { COOKIE_SESSAO, lerToken, loginAtivo } from '@/lib/sessao'
import { UserRole } from '@/types/database'

// O acesso é por usuário, não por e-mail. Como o Supabase Auth exige um e-mail,
// cada usuário recebe um endereço interno <usuario>@ilan.local que nunca recebe mensagens.
export const DOMINIO_INTERNO = 'ilan.local'

export function loginParaEmail(login: string) {
  return `${login.trim().toLowerCase()}@${DOMINIO_INTERNO}`
}

export function emailParaLogin(email: string) {
  return email.split('@')[0]
}

export const FORMATO_LOGIN = /^[a-z0-9._-]{3,40}$/

export type UsuarioAtual = { id: string; name: string; role: UserRole; campus_id: string | null }

// cache: layout, menu e página leem o mesmo usuário numa só consulta por requisição
export const getUsuarioAtual = cache(async (): Promise<UsuarioAtual | null> => {
  const sessao = await lerToken(cookies().get(COOKIE_SESSAO)?.value).catch(() => null)
  if (!sessao) return null
  const { data } = await getSupabase()
    .from('users')
    .select('id, name, role, campus_id, is_active')
    .eq('id', sessao.uid)
    .maybeSingle()
  if (!data || !data.is_active) return null
  return { id: data.id, name: data.name, role: data.role, campus_id: data.campus_id }
})

// Ids dos usuários que já têm senha (conta no Supabase Auth). Null se a chave de admin não estiver configurada.
export async function idsComAcesso(): Promise<Set<string> | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const { data, error } = await getSupabaseAdmin().auth.admin.listUsers({ perPage: 1000 })
  if (error) return null
  return new Set(data.users.map(u => u.id))
}

// Com o login ligado, exige um usuário ativo (usado nas server actions e no layout)
export async function exigirLogin() {
  if (!loginAtivo()) return null
  const usuario = await getUsuarioAtual()
  if (!usuario) redirect('/login')
  return usuario
}

// Com o login ligado, só o admin entra nas áreas de Usuários e Logs
export async function exigirAdmin() {
  if (!loginAtivo()) return null
  const usuario = await getUsuarioAtual()
  if (!usuario) redirect('/login')
  if (usuario.role !== 'admin') redirect('/dashboard?sem_permissao=1')
  return usuario
}

export type AcaoLog =
  | 'login'
  | 'login_falhou'
  | 'logout'
  | 'equipamento_criado'
  | 'manutencao_aberta'
  | 'manutencao_atualizada'
  | 'usuario_criado'
  | 'usuario_editado'
  | 'senha_definida'
  | 'senha_alterada'

type Log = {
  acao: AcaoLog
  descricao: string
  entidade?: 'equipment' | 'maintenance_request' | 'user'
  entidade_id?: string | null
  // Quem fez. Sem informar, usa o usuário logado.
  usuario?: { id: string | null; name: string } | null
}

// Nunca interrompe a ação principal: se o log falhar, só registra no console.
export async function registrarLog({ acao, descricao, entidade, entidade_id, usuario }: Log) {
  try {
    const autor = usuario === undefined ? await getUsuarioAtual() : usuario
    const { error } = await getSupabase()
      .from('activity_logs')
      .insert({
        user_id: autor?.id ?? null,
        user_name: autor?.name ?? 'Sem login',
        action: acao,
        entity: entidade ?? null,
        entity_id: entidade_id ?? null,
        description: descricao,
      })
    if (error) console.error('Falha ao registrar log:', error.message)
  } catch (e) {
    console.error('Falha ao registrar log:', e)
  }
}
