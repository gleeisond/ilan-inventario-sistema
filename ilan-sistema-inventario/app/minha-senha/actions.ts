'use server'

import { redirect } from 'next/navigation'
import { criarClienteLogin, getSupabase, getSupabaseAdmin } from '@/lib/supabase'
import { exigirLogin, registrarLog } from '@/lib/auth'

export async function trocarSenha(form: FormData) {
  function voltarCom(erro: string): never {
    redirect(`/minha-senha?erro=${encodeURIComponent(erro)}`)
  }

  const usuario = await exigirLogin()
  if (!usuario) voltarCom('A troca de senha só funciona com o login ligado.')

  const atual = String(form.get('atual') ?? '')
  const nova = String(form.get('nova') ?? '')
  const confirmacao = String(form.get('confirmacao') ?? '')

  if (!atual || !nova) voltarCom('Preencha a senha atual e a nova senha.')
  if (nova.length < 6) voltarCom('A nova senha precisa ter pelo menos 6 caracteres.')
  if (nova !== confirmacao) voltarCom('A confirmação não bate com a nova senha.')
  if (nova === atual) voltarCom('A nova senha precisa ser diferente da atual.')

  const { data: cadastro } = await getSupabase().from('users').select('email').eq('id', usuario.id).maybeSingle()
  if (!cadastro?.email) voltarCom('Não foi possível encontrar seu cadastro.')

  // Confere a senha atual antes de trocar
  const { data: conferido, error: erroLogin } = await criarClienteLogin().auth.signInWithPassword({ email: cadastro.email, password: atual })
  if (erroLogin || conferido.user?.id !== usuario.id) voltarCom('A senha atual está incorreta.')

  const { error } = await getSupabaseAdmin().auth.admin.updateUserById(usuario.id, { password: nova })
  if (error) voltarCom(`Não foi possível trocar a senha: ${error.message}`)

  await registrarLog({ acao: 'senha_alterada', descricao: 'Trocou a própria senha', entidade: 'user', entidade_id: usuario.id, usuario })
  redirect('/minha-senha?salvo=1')
}
