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

// O superadmin (role 'superadmin') só gerencia a plataforma: não pertence a nenhuma igreja
// e não entra em nenhuma tela com dados de igreja (ver exigirLogin e dadosDaIgreja).
export type UsuarioAtual = {
  id: string
  name: string
  role: UserRole
  campus_id: string | null
  region_id: string | null
  igreja_id: string | null
  superadmin: boolean
}

type LinhaUsuario = {
  id: string
  name: string
  role: UserRole
  campus_id: string | null
  region_id: string | null
  igreja_id: string | null
  is_active: boolean
  igreja: { situacao: string } | null
}

// cache: layout, menu e página leem o mesmo usuário numa só consulta por requisição
export const getUsuarioAtual = cache(async (): Promise<UsuarioAtual | null> => {
  const sessao = await lerToken(cookies().get(COOKIE_SESSAO)?.value).catch(() => null)
  if (!sessao) return null
  const { data } = await getSupabase()
    .from('users')
    .select('id, name, role, campus_id, region_id, igreja_id, is_active, igreja:igreja_id (situacao)')
    .eq('id', sessao.uid)
    .maybeSingle()
  const linha = data as unknown as LinhaUsuario | null
  if (!linha || !linha.is_active) return null
  const superadmin = linha.role === 'superadmin'
  // Usuário de igreja em implantação ou suspensa não entra (o superadmin não tem igreja)
  if (!superadmin && linha.igreja?.situacao !== 'ativa') return null
  return {
    id: linha.id,
    name: linha.name,
    role: linha.role,
    campus_id: linha.campus_id,
    region_id: linha.region_id,
    igreja_id: linha.igreja_id,
    superadmin,
  }
})

export type IgrejaDoContexto = { id: string; nome: string; logo_url: string | null; cor_principal: string; modulos: string[] }

// Igreja cujos dados aparecem nas telas do sistema: a do usuário logado.
// O superadmin não tem igreja e nunca recebe dados de uma: aqui ele é recusado.
export const dadosDaIgreja = cache(async (): Promise<IgrejaDoContexto> => {
  const usuario = await getUsuarioAtual()
  if (usuario?.superadmin) throw new Error('O administrador Genesis41 não acessa dados das igrejas.')
  const colunas = 'id, nome, logo_url, cor_principal, modulos'
  const supabase = getSupabase()
  if (usuario?.igreja_id) {
    const { data } = await supabase.from('igrejas').select(colunas).eq('id', usuario.igreja_id).single()
    if (!data) throw new Error('Igreja do usuário não encontrada.')
    return data as IgrejaDoContexto
  }
  // Modo de teste sem login: a igreja mais antiga
  const { data } = await supabase.from('igrejas').select(colunas).order('criada_em').limit(1).maybeSingle()
  if (!data) throw new Error('Nenhuma igreja cadastrada. Rode sql/05_igrejas.sql.')
  return data as IgrejaDoContexto
})

export const igrejaDoContexto = cache(async (): Promise<string> => (await dadosDaIgreja()).id)

// E-mail interno do próprio usuário logado. Lê direto (sem filtro de igreja) porque o superadmin não tem igreja.
export async function emailDoUsuario(id: string) {
  const { data } = await getSupabase().from('users').select('email').eq('id', id).maybeSingle()
  return (data?.email as string | undefined) ?? null
}

// Ids dos usuários que já têm senha (conta no Supabase Auth). Null se a chave de admin não estiver configurada.
export async function idsComAcesso(): Promise<Set<string> | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const { data, error } = await getSupabaseAdmin().auth.admin.listUsers({ perPage: 1000 })
  if (error) return null
  return new Set(data.users.map(u => u.id))
}

// Com o login ligado, exige um usuário ativo (usado nas telas e server actions das igrejas).
// O superadmin vai para o painel da plataforma, exceto onde permitirSuperadmin (ex.: trocar a senha).
export async function exigirLogin({ permitirSuperadmin = false } = {}) {
  if (!loginAtivo()) return null
  const usuario = await getUsuarioAtual()
  if (!usuario) redirect('/login')
  if (usuario.superadmin && !permitirSuperadmin) redirect('/plataforma/igrejas')
  return usuario
}

// Com o login ligado, só o admin da igreja entra nas áreas de Usuários, Cadastros e Logs
export async function exigirAdmin() {
  if (!loginAtivo()) return null
  const usuario = await getUsuarioAtual()
  if (!usuario) redirect('/login')
  if (usuario.superadmin) redirect('/plataforma/igrejas')
  if (usuario.role !== 'admin') redirect('/dashboard?sem_permissao=1')
  return usuario
}

// Painel da plataforma Genesis41: só o superadmin
export async function exigirSuperadmin() {
  if (!loginAtivo()) return null
  const usuario = await getUsuarioAtual()
  if (!usuario) redirect('/login')
  if (!usuario.superadmin) redirect('/dashboard?sem_permissao=1')
  return usuario
}

export type AcaoLog =
  | 'login'
  | 'login_falhou'
  | 'logout'
  | 'equipamento_criado'
  | 'equipamento_editado'
  | 'equipamento_baixa'
  | 'equipamento_reativado'
  | 'equipamento_excluido'
  | 'manutencao_aberta'
  | 'manutencao_atualizada'
  | 'manutencao_etapa'
  | 'usuario_criado'
  | 'usuario_editado'
  | 'senha_definida'
  | 'senha_alterada'
  | 'cadastro_criado'
  | 'cadastro_editado'
  | 'cadastro_excluido'
  | 'relatorio_exportado'
  | 'igreja_criada'
  | 'igreja_editada'

type Log = {
  acao: AcaoLog
  descricao: string
  entidade?: 'equipment' | 'maintenance_request' | 'user' | 'campus' | 'category' | 'location' | 'igreja' | 'region'
  entidade_id?: string | null
  // Quem fez. Sem informar, usa o usuário logado.
  usuario?: { id: string | null; name: string } | null
  // Igreja em que a ação aconteceu. Sem informar, usa a do contexto; null registra como ação da plataforma.
  igreja_id?: string | null
}

// Nunca interrompe a ação principal: se o log falhar, só registra no console.
export async function registrarLog({ acao, descricao, entidade, entidade_id, usuario, igreja_id }: Log) {
  try {
    const autor = usuario === undefined ? await getUsuarioAtual() : usuario
    const igreja = igreja_id === undefined ? await igrejaDoContexto().catch(() => null) : igreja_id
    const { error } = await getSupabase()
      .from('activity_logs')
      .insert({
        user_id: autor?.id ?? null,
        user_name: autor?.name ?? 'Sem login',
        action: acao,
        entity: entidade ?? null,
        entity_id: entidade_id ?? null,
        description: descricao,
        igreja_id: igreja,
      })
    if (error) console.error('Falha ao registrar log:', error.message)
  } catch (e) {
    console.error('Falha ao registrar log:', e)
  }
}
