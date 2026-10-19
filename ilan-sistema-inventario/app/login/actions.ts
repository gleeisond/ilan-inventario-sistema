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

  const { data: autenticado, error } = await criarClienteLogin().auth.signInWithPassword({ email: loginParaEmail(login), password: senha })
  if (error || !autenticado.user) {
    await registrarLog({ acao: 'login_falhou', descricao: `Tentativa de entrar como "${login}"`, usuario: { id: null, name: login } })
    falhar('Usuário ou senha incorretos.')
  }

  const { data } = await getSupabase()
    .from('users')
    .select('id, name, role, is_active, igreja_id, igreja:igreja_id (situacao)')
    .eq('id', autenticado.user.id)
    .maybeSingle()
  const usuario = data as unknown as { id: string; name: string; role: string; is_active: boolean; igreja_id: string | null; igreja: { situacao: string } | null } | null
  const igreja_id = usuario?.igreja_id ?? null
  if (!usuario || !usuario.is_active) {
    await registrarLog({ acao: 'login_falhou', descricao: `Acesso bloqueado para "${login}"`, usuario: { id: usuario?.id ?? null, name: usuario?.name ?? login }, igreja_id })
    falhar('Seu acesso está bloqueado. Fale com o administrador.')
  }
  // Igreja ainda em implantação (ou suspensa): ninguém dela entra, só o superadmin
  if (usuario.role !== 'superadmin' && usuario.igreja?.situacao !== 'ativa') {
    await registrarLog({ acao: 'login_falhou', descricao: `Igreja ainda não liberada para "${login}"`, usuario, igreja_id })
    falhar(usuario.igreja?.situacao === 'suspensa' ? 'O acesso da sua igreja está suspenso.' : 'Sua igreja ainda está em implantação. Em breve o acesso será liberado.')
  }

  cookies().set(COOKIE_SESSAO, await criarToken(usuario.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURACAO_SESSAO_SEGUNDOS,
  })
  await registrarLog({ acao: 'login', descricao: 'Entrou no sistema', entidade: 'user', entidade_id: usuario.id, usuario, igreja_id })
  redirect(voltar)
}

export async function sair() {
  const usuario = await getUsuarioAtual()
  if (usuario) await registrarLog({ acao: 'logout', descricao: 'Saiu do sistema', usuario })
  cookies().delete(COOKIE_SESSAO)
  redirect('/login')
}
