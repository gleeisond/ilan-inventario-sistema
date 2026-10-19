'use server'

import { randomUUID } from 'crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabase } from '@/lib/supabase'
import { sincronizarAcesso } from '@/lib/acesso'
import { FORMATO_LOGIN, exigirAdmin, igrejaDoContexto, loginParaEmail, registrarLog } from '@/lib/auth'
import { PERFIS, PERFIL_LABELS, PERFIL_VINCULO } from '@/lib/usuarios'
import { UserRole } from '@/types/database'

function texto(form: FormData, campo: string) {
  const valor = String(form.get(campo) ?? '').trim()
  return valor === '' ? null : valor
}

export async function salvarUsuario(form: FormData) {
  const adminLogado = await exigirAdmin()

  const id = texto(form, 'id')
  const pagina = id ? `/usuarios/${id}` : '/usuarios/novo'
  function voltarCom(erro: string): never {
    redirect(`${pagina}?erro=${encodeURIComponent(erro)}`)
  }

  const name = texto(form, 'name')
  const login = texto(form, 'login')?.toLowerCase() ?? null
  const senha = texto(form, 'senha')
  const role = texto(form, 'role') as UserRole | null

  if (!name || !login || !role) voltarCom('Preencha nome, usuário e perfil.')
  if (!FORMATO_LOGIN.test(login)) {
    voltarCom('Usuário inválido. Use de 3 a 40 letras minúsculas, números, ponto, hífen ou sublinhado (ex: joao.silva).')
  }
  if (!PERFIS.includes(role)) voltarCom('Perfil inválido.')
  if (adminLogado && adminLogado.id === id && (role !== 'admin' || form.get('is_active') !== 'on')) {
    voltarCom('Você não pode tirar o seu próprio acesso de administrador.')
  }
  if (senha && senha.length < 6) voltarCom('A senha precisa ter pelo menos 6 caracteres.')

  // Guarda só o vínculo que o perfil usa, para não sobrar campus/região de um perfil anterior
  const vinculo = PERFIL_VINCULO[role]
  const campus_id = vinculo === 'campus' ? texto(form, 'campus_id') : null
  const region_id = vinculo === 'regiao' ? texto(form, 'region_id') : null
  if (vinculo === 'campus' && !campus_id) voltarCom('Escolha o campus deste usuário.')
  if (vinculo === 'regiao' && !region_id) voltarCom('Escolha a região deste usuário.')

  // O mesmo usuário não pode existir duas vezes, nem com o e-mail antigo (ex: lider.arena@ilan.com)
  const supabase = getSupabase()
  const igreja = await igrejaDoContexto()
  // Só edita usuários da própria igreja (o superadmin não tem igreja, então nunca é editado por aqui)
  if (id) {
    const { data: alvo } = await supabase.from('users').select('id').eq('id', id).eq('igreja_id', igreja).maybeSingle()
    if (!alvo) voltarCom('Usuário não encontrado.')
  }
  // Campus e região escolhidos precisam ser da mesma igreja
  if (campus_id) {
    const { data: c } = await supabase.from('campus').select('id').eq('id', campus_id).eq('igreja_id', igreja).maybeSingle()
    if (!c) voltarCom('Campus não encontrado.')
  }
  if (region_id) {
    const { data: r } = await supabase.from('regions').select('id').eq('id', region_id).eq('igreja_id', igreja).maybeSingle()
    if (!r) voltarCom('Região não encontrada.')
  }
  const { data: repetidos } = await supabase.from('users').select('id').ilike('email', `${login.replace(/[_%\\]/g, '\\$&')}@%`)
  if (repetidos?.some(u => u.id !== id)) voltarCom(`Já existe um usuário "${login}".`)

  const email = loginParaEmail(login)
  const dados = { name, email, role, campus_id, region_id, is_active: form.get('is_active') === 'on' }
  const novoId = id ?? randomUUID()
  const { error } = id
    ? await supabase.from('users').update(dados).eq('id', id)
    : await supabase.from('users').insert({ id: novoId, ...dados, igreja_id: igreja })
  if (error) {
    voltarCom(error.code === '23505' ? `Já existe um usuário "${login}".` : 'Não foi possível salvar: ' + error.message)
  }

  await registrarLog({
    acao: id ? 'usuario_editado' : 'usuario_criado',
    descricao: `${id ? 'Editou' : 'Cadastrou'} ${name} (${login}) como ${PERFIL_LABELS[role]}${dados.is_active ? '' : ', com acesso bloqueado'}`,
    entidade: 'user',
    entidade_id: novoId,
  })

  if (senha || process.env.SUPABASE_SERVICE_ROLE_KEY) {
    let erroAcesso: string | null
    try {
      erroAcesso = await sincronizarAcesso(novoId, email, senha)
    } catch (e) {
      erroAcesso = e instanceof Error ? e.message : String(e)
    }
    if (erroAcesso) {
      redirect(`/usuarios/${novoId}?erro=${encodeURIComponent('Cadastro salvo, mas a senha não foi definida: ' + erroAcesso)}`)
    }
    if (senha) {
      await registrarLog({ acao: 'senha_definida', descricao: `Definiu a senha de ${name} (${login})`, entidade: 'user', entidade_id: novoId })
    }
  }

  revalidatePath('/usuarios')
  redirect(`/usuarios?salvo=${encodeURIComponent(name)}`)
}
