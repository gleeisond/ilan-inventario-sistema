// lib/convites.ts
// Convite para o administrador de uma igreja criar o próprio acesso (só no servidor).
// O link leva um código aleatório; no banco fica só o hash dele.

import { createHash, randomBytes } from 'crypto'
import { randomUUID } from 'crypto'
import { getSupabase } from '@/lib/supabase'
import { sincronizarAcesso } from '@/lib/acesso'
import { FORMATO_LOGIN, loginParaEmail } from '@/lib/auth'
import { daIgreja } from '@/lib/db'

export const VALIDADE_CONVITE_DIAS = 7

const hash = (token: string) => createHash('sha256').update(token).digest('hex')

export async function criarConvite(igrejaId: string, nome: string) {
  const token = randomBytes(24).toString('base64url')
  const expira = new Date(Date.now() + VALIDADE_CONVITE_DIAS * 86_400_000).toISOString()
  const { error } = await getSupabase().from('convites').insert({ igreja_id: igrejaId, token_hash: hash(token), nome, expira_em: expira })
  if (error) throw new Error('Não foi possível criar o convite: ' + error.message)
  return token
}

export type ConviteValido = { id: string; igreja_id: string; nome: string; igreja: { nome: string; situacao: string } }

// Convite ainda não usado e dentro da validade, ou null
export async function buscarConvite(token: string): Promise<ConviteValido | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null
  const { data } = await getSupabase()
    .from('convites')
    .select('id, igreja_id, nome, expira_em, usado_em, igreja:igreja_id (nome, situacao)')
    .eq('token_hash', hash(token))
    .maybeSingle()
  const c = data as unknown as (ConviteValido & { expira_em: string; usado_em: string | null }) | null
  if (!c || c.usado_em || Date.parse(c.expira_em) < Date.now()) return null
  return { id: c.id, igreja_id: c.igreja_id, nome: c.nome, igreja: c.igreja }
}

// Reserva o convite antes de criar o usuário: só um envio consegue (o mesmo link não cria dois acessos)
export async function reservarConvite(id: string) {
  const { data } = await getSupabase()
    .from('convites')
    .update({ usado_em: new Date().toISOString() })
    .eq('id', id)
    .is('usado_em', null)
    .select('id')
  return (data ?? []).length === 1
}

export async function concluirConvite(id: string, usuarioId: string) {
  await getSupabase().from('convites').update({ usuario_id: usuarioId }).eq('id', id)
}

// Algo deu errado depois da reserva: o link volta a valer
export async function liberarConvite(id: string) {
  await getSupabase().from('convites').update({ usado_em: null }).eq('id', id).is('usuario_id', null)
}

export async function convitesPendentes(igrejaId: string) {
  const { data } = await getSupabase()
    .from('convites')
    .select('id, nome, criado_em, expira_em')
    .eq('igreja_id', igrejaId)
    .is('usado_em', null)
    .gt('expira_em', new Date().toISOString())
    .order('criado_em', { ascending: false })
  return (data ?? []) as { id: string; nome: string; criado_em: string; expira_em: string }[]
}

export async function cancelarConvite(id: string, igrejaId: string) {
  await getSupabase().from('convites').delete().eq('id', id).eq('igreja_id', igrejaId).is('usado_em', null)
}

// Cria o administrador da igreja com o usuário e a senha escolhidos por ele. Retorna o id ou a mensagem de erro.
export async function criarAdministrador(igrejaId: string, nome: string, login: string, senha: string): Promise<{ id: string } | { erro: string }> {
  if (!FORMATO_LOGIN.test(login)) return { erro: 'Usuário inválido. Use de 3 a 40 letras minúsculas, números, ponto, hífen ou sublinhado (ex: maria.souza).' }
  if (senha.length < 6) return { erro: 'A senha precisa ter pelo menos 6 caracteres.' }
  // O usuário é único na plataforma inteira, não só na igreja
  const { data: repetidos } = await getSupabase().from('users').select('id').ilike('email', `${login.replace(/[_%\\]/g, '\\$&')}@%`)
  if (repetidos?.length) return { erro: `O usuário "${login}" já existe. Escolha outro.` }

  const id = randomUUID()
  const email = loginParaEmail(login)
  const { error } = await (await daIgreja(igrejaId)).insert('users', { id, name: nome, email, role: 'admin', is_active: true })
  if (error) return { erro: error.code === '23505' ? `O usuário "${login}" já existe. Escolha outro.` : 'Não foi possível criar o acesso: ' + error.message }
  const erroAcesso = await sincronizarAcesso(id, email, senha).catch(e => (e instanceof Error ? e.message : String(e)))
  if (erroAcesso) {
    await getSupabase().from('users').delete().eq('id', id)
    return { erro: 'Não foi possível definir a senha: ' + erroAcesso }
  }
  return { id }
}
