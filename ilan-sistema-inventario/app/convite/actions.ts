'use server'

import { redirect } from 'next/navigation'
import { registrarLog } from '@/lib/auth'
import { buscarConvite, concluirConvite, criarAdministrador, liberarConvite, reservarConvite } from '@/lib/convites'

// O administrador da igreja aceita o convite escolhendo o próprio usuário e senha
export async function aceitarConvite(form: FormData) {
  const token = String(form.get('token') ?? '')
  const nome = String(form.get('nome') ?? '').trim()
  const login = String(form.get('login') ?? '').trim().toLowerCase()
  const senha = String(form.get('senha') ?? '')
  const confirmacao = String(form.get('confirmacao') ?? '')
  const voltarCom: (erro: string) => never = erro => redirect(`/convite/${encodeURIComponent(token)}?erro=${encodeURIComponent(erro)}`)

  const convite = await buscarConvite(token)
  if (!convite) redirect(`/convite/${encodeURIComponent(token)}`)
  if (!nome || !login || !senha) voltarCom('Preencha nome, usuário e senha.')
  if (senha !== confirmacao) voltarCom('A confirmação não bate com a senha.')

  if (!(await reservarConvite(convite.id))) redirect(`/convite/${encodeURIComponent(token)}`)
  const criado = await criarAdministrador(convite.igreja_id, nome, login, senha)
  if ('erro' in criado) {
    await liberarConvite(convite.id)
    voltarCom(criado.erro)
  }
  await concluirConvite(convite.id, criado.id)
  await registrarLog({
    acao: 'usuario_criado',
    descricao: `${nome} (${login}) aceitou o convite e criou o acesso de administrador`,
    entidade: 'user',
    entidade_id: criado.id,
    usuario: { id: criado.id, name: nome },
    igreja_id: convite.igreja_id,
  })
  redirect('/login?criado=1')
}
