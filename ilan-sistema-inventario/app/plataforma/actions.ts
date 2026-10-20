'use server'

import { randomUUID } from 'crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabase } from '@/lib/supabase'
import { sincronizarAcesso } from '@/lib/acesso'
import { FORMATO_LOGIN, exigirSuperadmin, loginParaEmail, registrarLog } from '@/lib/auth'
import { daIgreja } from '@/lib/db'
import { PLANOS } from '@/lib/igrejas'
import { MODULOS } from '@/lib/modulos'
import { PlanoIgreja, SituacaoIgreja } from '@/types/database'

// Tudo o que é feito aqui é ação da plataforma: os logs ficam sem igreja (igreja_id null)
// e não aparecem no histórico de nenhuma igreja.

function texto(form: FormData, campo: string) {
  const valor = String(form.get(campo) ?? '').trim()
  return valor === '' ? null : valor
}

function voltar(caminho: string, param: 'erro' | 'salvo', mensagem: string): never {
  revalidatePath(caminho)
  redirect(`${caminho}?${param}=${encodeURIComponent(mensagem)}`)
}

function lerDadosIgreja(form: FormData, caminho: string) {
  const nome = texto(form, 'nome')
  const plano = texto(form, 'plano') as PlanoIgreja | null
  const cor = (texto(form, 'cor_principal') ?? '#E0AE4E').toUpperCase()
  if (!nome) voltar(caminho, 'erro', 'Informe o nome da igreja.')
  if (!plano || !(plano in PLANOS)) voltar(caminho, 'erro', 'Escolha o plano.')
  if (!/^#[0-9A-F]{6}$/.test(cor)) voltar(caminho, 'erro', 'Cor inválida. Use o formato #RRGGBB.')
  return {
    nome,
    plano,
    cor_principal: cor,
    cidade: texto(form, 'cidade'),
    responsavel: texto(form, 'responsavel'),
    contato: texto(form, 'contato'),
  }
}

export async function criarIgreja(form: FormData) {
  await exigirSuperadmin()
  const caminho = '/plataforma/igrejas'
  const dados = lerDadosIgreja(form, caminho)
  const supabase = getSupabase()

  const { data, error } = await supabase.from('igrejas').insert({ ...dados, situacao: 'implantacao' }).select('id').single()
  if (error) voltar(caminho, 'erro', error.code === '23505' ? `Já existe uma igreja chamada "${dados.nome}".` : `Não foi possível criar: ${error.message}`)

  // Toda igreja começa com uma região, para já poder cadastrar as filiais
  await (await daIgreja(data.id)).insert('regions', { name: 'Principal' })

  await registrarLog({ acao: 'igreja_criada', descricao: `Criou a igreja ${dados.nome} (plano ${PLANOS[dados.plano].nome})`, entidade: 'igreja', entidade_id: data.id, igreja_id: null })
  redirect(`/plataforma/igrejas/${data.id}?salvo=${encodeURIComponent(`Igreja ${dados.nome} criada. Agora cadastre as filiais e o administrador.`)}`)
}

export async function salvarIgreja(form: FormData) {
  await exigirSuperadmin()
  const id = texto(form, 'id')
  if (!id) voltar('/plataforma/igrejas', 'erro', 'Igreja não informada.')
  const caminho = `/plataforma/igrejas/${id}`
  const dados = lerDadosIgreja(form, caminho)
  const supabase = getSupabase()

  const { data: atual } = await supabase.from('igrejas').select('situacao').eq('id', id).maybeSingle()
  if (!atual) voltar('/plataforma/igrejas', 'erro', 'Igreja não encontrada.')

  const pedida = texto(form, 'situacao') as SituacaoIgreja | null
  const situacao: SituacaoIgreja = pedida === 'implantacao' || pedida === 'ativa' || pedida === 'suspensa' ? pedida : (atual.situacao as SituacaoIgreja)

  const { error } = await supabase
    .from('igrejas')
    .update({ ...dados, situacao, atualizada_em: new Date().toISOString() })
    .eq('id', id)
  if (error) voltar(caminho, 'erro', error.code === '23505' ? `Já existe uma igreja chamada "${dados.nome}".` : `Não foi possível salvar: ${error.message}`)

  const mudou = situacao !== atual.situacao ? ` (situação: ${atual.situacao} → ${situacao})` : ''
  await registrarLog({ acao: 'igreja_editada', descricao: `Editou os dados da igreja ${dados.nome}${mudou}`, entidade: 'igreja', entidade_id: id, igreja_id: null })
  voltar(caminho, 'salvo', 'Dados da igreja salvos.')
}

export async function salvarModulos(form: FormData) {
  await exigirSuperadmin()
  const id = texto(form, 'id')
  if (!id) voltar('/plataforma/igrejas', 'erro', 'Igreja não informada.')
  const caminho = `/plataforma/igrejas/${id}`
  // Qualquer combinação de módulos. Os que ainda estão em prévia ficam liberados e aparecem
  // para a igreja como "em implantação" até saírem da prévia.
  const escolhidos = form.getAll('modulos').map(String)
  const modulos = MODULOS.filter(m => escolhidos.includes(m.id)).map(m => m.id)
  if (modulos.length === 0) voltar(caminho, 'erro', 'Libere pelo menos um módulo para a igreja.')

  const supabase = getSupabase()
  const { data, error } = await supabase.from('igrejas').update({ modulos, atualizada_em: new Date().toISOString() }).eq('id', id).select('nome').single()
  if (error) voltar(caminho, 'erro', `Não foi possível salvar: ${error.message}`)

  const nomes = modulos.map(id => MODULOS.find(m => m.id === id)!.nome).join(', ')
  await registrarLog({ acao: 'igreja_editada', descricao: `Módulos da igreja ${data.nome}: ${nomes}`, entidade: 'igreja', entidade_id: id, igreja_id: null })
  voltar(caminho, 'salvo', 'Módulos salvos.')
}

export async function criarRegiao(form: FormData) {
  await exigirSuperadmin()
  const igreja_id = texto(form, 'igreja_id')
  const name = texto(form, 'name')
  if (!igreja_id) voltar('/plataforma/igrejas', 'erro', 'Igreja não informada.')
  const caminho = `/plataforma/igrejas/${igreja_id}`
  if (!name) voltar(caminho, 'erro', 'Informe o nome da região.')

  const { data, error } = await (await daIgreja(igreja_id)).insert('regions', { name }).select('id').single()
  if (error) voltar(caminho, 'erro', error.code === '23505' ? `A região "${name}" já existe nesta igreja.` : `Não foi possível criar: ${error.message}`)

  await registrarLog({ acao: 'cadastro_criado', descricao: `Criou a região ${name}`, entidade: 'region', entidade_id: data.id, igreja_id: null })
  voltar(caminho, 'salvo', `Região ${name} criada.`)
}

export async function criarFilial(form: FormData) {
  await exigirSuperadmin()
  const igreja_id = texto(form, 'igreja_id')
  const name = texto(form, 'name')
  const region_id = texto(form, 'region_id')
  if (!igreja_id) voltar('/plataforma/igrejas', 'erro', 'Igreja não informada.')
  const caminho = `/plataforma/igrejas/${igreja_id}`
  if (!name || !region_id) voltar(caminho, 'erro', 'Preencha o nome e a região da filial.')

  const db = await daIgreja(igreja_id)
  const { data: regiao } = await db.select('regions', 'id').eq('id', region_id).maybeSingle()
  if (!regiao) voltar(caminho, 'erro', 'Região não encontrada nesta igreja.')

  const { data, error } = await db.insert('campus', { name, region_id, location: texto(form, 'location') }).select('id').single()
  if (error) voltar(caminho, 'erro', error.code === '23505' ? `Já existe uma filial chamada "${name}" nesta igreja.` : `Não foi possível criar: ${error.message}`)

  await registrarLog({ acao: 'cadastro_criado', descricao: `Criou a filial ${name}`, entidade: 'campus', entidade_id: data.id, igreja_id: null })
  voltar(caminho, 'salvo', `Filial ${name} criada.`)
}

export async function criarAdministrador(form: FormData) {
  await exigirSuperadmin()
  const igreja_id = texto(form, 'igreja_id')
  if (!igreja_id) voltar('/plataforma/igrejas', 'erro', 'Igreja não informada.')
  const caminho = `/plataforma/igrejas/${igreja_id}`

  const name = texto(form, 'name')
  const login = texto(form, 'login')?.toLowerCase() ?? null
  const senha = texto(form, 'senha')
  if (!name || !login || !senha) voltar(caminho, 'erro', 'Preencha nome, usuário e senha do administrador.')
  if (!FORMATO_LOGIN.test(login)) voltar(caminho, 'erro', 'Usuário inválido. Use de 3 a 40 letras minúsculas, números, ponto, hífen ou sublinhado.')
  if (senha.length < 6) voltar(caminho, 'erro', 'A senha precisa ter pelo menos 6 caracteres.')

  const supabase = getSupabase()
  const { data: igreja } = await supabase.from('igrejas').select('situacao').eq('id', igreja_id).maybeSingle()
  if (!igreja) voltar('/plataforma/igrejas', 'erro', 'Igreja não encontrada.')

  // O usuário é único na plataforma inteira, não só na igreja
  const { data: repetidos } = await supabase.from('users').select('id').ilike('email', `${login.replace(/[_%\\]/g, '\\$&')}@%`)
  if (repetidos?.length) voltar(caminho, 'erro', `Já existe um usuário "${login}". Escolha outro.`)

  const id = randomUUID()
  const email = loginParaEmail(login)
  const { error } = await (await daIgreja(igreja_id)).insert('users', { id, name, email, role: 'admin', is_active: true })
  if (error) voltar(caminho, 'erro', `Não foi possível cadastrar: ${error.message}`)

  let erroAcesso: string | null
  try {
    erroAcesso = await sincronizarAcesso(id, email, senha)
  } catch (e) {
    erroAcesso = e instanceof Error ? e.message : String(e)
  }
  await registrarLog({ acao: 'usuario_criado', descricao: `Cadastrou ${name} (${login}) como administrador da igreja`, entidade: 'user', entidade_id: id, igreja_id: null })
  if (erroAcesso) voltar(caminho, 'erro', `Administrador cadastrado, mas a senha não foi definida: ${erroAcesso}`)
  voltar(caminho, 'salvo', `Administrador ${name} cadastrado.${igreja.situacao === 'ativa' ? '' : ' O acesso é liberado quando a igreja for ativada.'}`)
}
