'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { criarClienteLogin, getSupabase } from '@/lib/supabase'
import { COOKIE_SESSAO, DURACAO_SESSAO_SEGUNDOS, criarToken } from '@/lib/sessao'
import { getUsuarioAtual, loginParaEmail, registrarLog } from '@/lib/auth'

function destinoSeguro(voltar: string | null) {
  return voltar && voltar.startsWith('/') && !voltar.startsWith('//') && voltar !== '/login' ? voltar : '/dashboard'
}

export async function entrar(form: FormData) {
  const login = String(form.get('login') ?? '').trim().toLowerCase()
  const senha = String(form.get('senha') ?? '')
  const voltar = destinoSeguro(form.get('voltar') as string | null)
  function falhar(erro: string): never {
    redirect(`/login?erro=${encodeURIComponent(erro)}&voltar=${encodeURIComponent(voltar)}`)
  }

  if (!login || !senha) falhar('Informe usuário e senha.')

  const { data, error } = await criarClienteLogin().auth.signInWithPassword({ email: loginParaEmail(login), password: senha })
  if (error || !data.user) {
    await registrarLog({ acao: 'login_falhou', descricao: `Tentativa de entrar como "${login}"`, usuario: { id: null, name: login } })
    falhar('Usuário ou senha incorretos.')
  }

  const { data: usuario } = await getSupabase().from('users').select('id, name, is_active').eq('id', data.user.id).maybeSingle()
  if (!usuario || !usuario.is_active) {
    await registrarLog({ acao: 'login_falhou', descricao: `Acesso bloqueado para "${login}"`, usuario: { id: usuario?.id ?? null, name: usuario?.name ?? login } })
    falhar('Seu acesso está bloqueado. Fale com o administrador.')
  }

  cookies().set(COOKIE_SESSAO, await criarToken(usuario.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURACAO_SESSAO_SEGUNDOS,
  })
  await registrarLog({ acao: 'login', descricao: 'Entrou no sistema', entidade: 'user', entidade_id: usuario.id, usuario })
  redirect(voltar)
}

export async function sair() {
  const usuario = await getUsuarioAtual()
  if (usuario) await registrarLog({ acao: 'logout', descricao: 'Saiu do sistema', usuario })
  cookies().delete(COOKIE_SESSAO)
  redirect('/login')
}
