'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabase } from '@/lib/supabase'
import { exigirAdmin, registrarLog } from '@/lib/auth'

function texto(form: FormData, campo: string) {
  const valor = String(form.get(campo) ?? '').trim()
  return valor === '' ? null : valor
}

function voltar(caminho: string, param: 'erro' | 'salvo', mensagem: string): never {
  revalidatePath(caminho)
  redirect(`${caminho}?${param}=${encodeURIComponent(mensagem)}`)
}

function plural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`
}

// ---------- Campus ----------

export async function salvarCampus(form: FormData) {
  await exigirAdmin()
  const caminho = '/cadastros/campus'
  const id = texto(form, 'id')
  const name = texto(form, 'name')
  const region_id = texto(form, 'region_id')
  const location = texto(form, 'location')
  if (!name || !region_id) voltar(id ? `${caminho}/${id}` : caminho, 'erro', 'Preencha o nome e a região.')

  const supabase = getSupabase()
  const { data, error } = id
    ? await supabase.from('campus').update({ name, region_id, location }).eq('id', id).select('id').single()
    : await supabase.from('campus').insert({ name, region_id, location }).select('id').single()

  if (error) {
    const msg = error.code === '23505' ? `Já existe um campus chamado "${name}".` : `Não foi possível salvar: ${error.message}`
    voltar(id ? `${caminho}/${id}` : caminho, 'erro', msg)
  }

  await registrarLog({
    acao: id ? 'cadastro_editado' : 'cadastro_criado',
    descricao: `${id ? 'Editou' : 'Criou'} o campus ${name}`,
    entidade: 'campus',
    entidade_id: data.id,
  })
  voltar(caminho, 'salvo', id ? `Campus ${name} atualizado.` : `Campus ${name} criado.`)
}

export async function excluirCampus(form: FormData) {
  await exigirAdmin()
  const caminho = '/cadastros/campus'
  const id = texto(form, 'id')
  if (!id) voltar(caminho, 'erro', 'Campus não informado.')

  const supabase = getSupabase()
  const contar = (tabela: string) => supabase.from(tabela).select('id', { count: 'exact', head: true }).eq('campus_id', id)
  const [{ data: campus }, equipamentos, usuarios, chamados] = await Promise.all([
    supabase.from('campus').select('name').eq('id', id).maybeSingle(),
    contar('equipment'),
    contar('users'),
    contar('maintenance_requests'),
  ])
  if (!campus) voltar(caminho, 'erro', 'Campus não encontrado.')

  // Excluir o campus apagaria em cascata os equipamentos e chamados dele, então só deixa excluir vazio
  const emUso = [
    equipamentos.count ? plural(equipamentos.count, 'equipamento', 'equipamentos') : null,
    chamados.count ? plural(chamados.count, 'chamado de manutenção', 'chamados de manutenção') : null,
    usuarios.count ? plural(usuarios.count, 'usuário', 'usuários') : null,
  ].filter(Boolean)
  if (emUso.length) {
    voltar(caminho, 'erro', `${campus.name} não pode ser excluído porque tem ${emUso.join(', ')}. Mova ou exclua esses registros antes.`)
  }

  const { error } = await supabase.from('campus').delete().eq('id', id)
  if (error) voltar(caminho, 'erro', `Não foi possível excluir: ${error.message}`)

  await registrarLog({ acao: 'cadastro_excluido', descricao: `Excluiu o campus ${campus.name}`, entidade: 'campus', entidade_id: id })
  voltar(caminho, 'salvo', `Campus ${campus.name} excluído.`)
}

// ---------- Categorias e locais ----------
// Os equipamentos guardam o nome (equipment.category / equipment.location),
// então renomear atualiza os equipamentos e excluir só é permitido sem uso.

const SIMPLES = {
  categorias: { tabela: 'categories', coluna: 'category', entidade: 'category', nome: 'categoria', artigo: 'a' },
  locais: { tabela: 'locations', coluna: 'location', entidade: 'location', nome: 'local', artigo: 'o' },
} as const

type TipoSimples = keyof typeof SIMPLES

function tipoDoForm(form: FormData): TipoSimples {
  const tipo = String(form.get('tipo'))
  if (tipo !== 'categorias' && tipo !== 'locais') throw new Error('Tipo de cadastro inválido')
  return tipo
}

export async function salvarSimples(form: FormData) {
  await exigirAdmin()
  const tipo = tipoDoForm(form)
  const cfg = SIMPLES[tipo]
  const caminho = `/cadastros/${tipo}`
  const id = texto(form, 'id')
  const name = texto(form, 'name')
  if (!name) voltar(caminho, 'erro', `Informe o nome d${cfg.artigo} ${cfg.nome}.`)

  const supabase = getSupabase()
  let anterior: string | null = null
  if (id) {
    const { data } = await supabase.from(cfg.tabela).select('name').eq('id', id).maybeSingle()
    if (!data) voltar(caminho, 'erro', `${cfg.nome} não encontrad${cfg.artigo}.`)
    anterior = data.name
  }

  const { data, error } = id
    ? await supabase.from(cfg.tabela).update({ name }).eq('id', id).select('id').single()
    : await supabase.from(cfg.tabela).insert({ name }).select('id').single()
  if (error) {
    const msg = error.code === '23505' ? `"${name}" já está cadastrad${cfg.artigo}.` : `Não foi possível salvar: ${error.message}`
    voltar(caminho, 'erro', msg)
  }

  let atualizados = 0
  if (anterior && anterior !== name) {
    const { count } = await supabase.from('equipment').update({ [cfg.coluna]: name }, { count: 'exact' }).eq(cfg.coluna, anterior)
    atualizados = count ?? 0
  }

  await registrarLog({
    acao: id ? 'cadastro_editado' : 'cadastro_criado',
    descricao: id
      ? `Renomeou ${cfg.artigo} ${cfg.nome} "${anterior}" para "${name}"${atualizados ? ` (${plural(atualizados, 'equipamento atualizado', 'equipamentos atualizados')})` : ''}`
      : `Criou ${cfg.artigo} ${cfg.nome} "${name}"`,
    entidade: cfg.entidade,
    entidade_id: data.id,
  })
  voltar(caminho, 'salvo', id ? `"${name}" atualizad${cfg.artigo}.` : `"${name}" criad${cfg.artigo}.`)
}

export async function excluirSimples(form: FormData) {
  await exigirAdmin()
  const tipo = tipoDoForm(form)
  const cfg = SIMPLES[tipo]
  const caminho = `/cadastros/${tipo}`
  const id = texto(form, 'id')
  if (!id) voltar(caminho, 'erro', 'Registro não informado.')

  const supabase = getSupabase()
  const { data: registro } = await supabase.from(cfg.tabela).select('name').eq('id', id).maybeSingle()
  if (!registro) voltar(caminho, 'erro', `${cfg.nome} não encontrad${cfg.artigo}.`)

  const { count } = await supabase.from('equipment').select('id', { count: 'exact', head: true }).eq(cfg.coluna, registro.name)
  if (count) {
    voltar(caminho, 'erro', `"${registro.name}" não pode ser excluíd${cfg.artigo} porque está em ${plural(count, 'equipamento', 'equipamentos')}. Troque nos equipamentos antes.`)
  }

  const { error } = await supabase.from(cfg.tabela).delete().eq('id', id)
  if (error) voltar(caminho, 'erro', `Não foi possível excluir: ${error.message}`)

  await registrarLog({ acao: 'cadastro_excluido', descricao: `Excluiu ${cfg.artigo} ${cfg.nome} "${registro.name}"`, entidade: cfg.entidade, entidade_id: id })
  voltar(caminho, 'salvo', `"${registro.name}" excluíd${cfg.artigo}.`)
}
