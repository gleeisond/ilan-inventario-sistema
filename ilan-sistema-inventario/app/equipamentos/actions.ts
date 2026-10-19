'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabase } from '@/lib/supabase'
import { lerMoeda, podeEditarNoCampus, podeExcluirEquipamento } from '@/lib/equipamentos'
import { exigirLogin, igrejaDoContexto, registrarLog } from '@/lib/auth'

function texto(form: FormData, campo: string) {
  const valor = String(form.get(campo) ?? '').trim()
  return valor === '' ? null : valor
}

function voltar(caminho: string, tipo: 'ok' | 'erro', mensagem: string): never {
  redirect(`${caminho}?${tipo}=${encodeURIComponent(mensagem)}`)
}

// Volta para a mesma lista (com os filtros) de onde a pessoa clicou
function voltarParaLista(retorno: string | null, tipo: 'ok' | 'erro', mensagem: string): never {
  const destino = retorno?.startsWith('/equipamentos') ? retorno : '/equipamentos'
  const sep = destino.includes('?') ? '&' : '?'
  redirect(`${destino}${sep}${tipo}=${encodeURIComponent(mensagem)}`)
}

// Lê e valida os campos do formulário. Em caso de erro volta para `caminho` com a mensagem.
async function lerFormulario(form: FormData, caminho: string, usuario: Awaited<ReturnType<typeof exigirLogin>>) {
  const name = texto(form, 'name')
  const campus_id = texto(form, 'campus_id')
  if (!name || !campus_id) voltar(caminho, 'erro', 'Preencha o nome e o campus.')

  const value = lerMoeda(texto(form, 'value'))
  if (value !== null && Number.isNaN(value)) voltar(caminho, 'erro', 'Valor inválido. Use só números, ex: 3500,00')

  const { data: campus } = await getSupabase()
    .from('campus')
    .select('id, name, region_id')
    .eq('id', campus_id)
    .eq('igreja_id', await igrejaDoContexto())
    .maybeSingle()
  if (!campus) voltar(caminho, 'erro', 'Campus não encontrado.')
  if (!podeEditarNoCampus(usuario, campus)) voltar(caminho, 'erro', `Você não tem permissão para cadastrar equipamentos em ${campus.name}.`)

  return {
    campus,
    dados: {
      name,
      campus_id,
      value,
      brand: texto(form, 'brand'),
      category: texto(form, 'category'),
      purchase_date: texto(form, 'purchase_date'),
      responsible_id: texto(form, 'responsible_id'),
      status: texto(form, 'status') ?? 'ativo',
      location: texto(form, 'location'),
      notes: texto(form, 'notes'),
    },
  }
}

type Atual = { id: string; name: string; status: string; campus: { id: string; name: string; region_id: string | null } | null }

// Busca o equipamento e confere se o usuário pode mexer nele
async function carregarComPermissao(id: string | null, usuario: Awaited<ReturnType<typeof exigirLogin>>) {
  if (!id) voltar('/equipamentos', 'erro', 'Equipamento não informado.')
  const { data } = await getSupabase()
    .from('equipment')
    .select('id, name, status, campus:campus_id (id, name, region_id)')
    .eq('id', id)
    .maybeSingle()
  const atual = data as unknown as Atual | null
  if (!atual) voltar('/equipamentos', 'erro', 'Equipamento não encontrado. Ele pode ter sido excluído.')
  if (atual.campus && !podeEditarNoCampus(usuario, atual.campus)) {
    voltar('/equipamentos', 'erro', `Você não tem permissão para alterar equipamentos de ${atual.campus.name}.`)
  }
  return atual
}

export async function criarEquipamento(form: FormData) {
  const usuario = await exigirLogin()
  const { campus, dados } = await lerFormulario(form, '/equipamentos/criar', usuario)

  const { data: criado, error } = await getSupabase().from('equipment').insert(dados).select('id').single()
  if (error) voltar('/equipamentos/criar', 'erro', 'Não foi possível salvar: ' + error.message)

  await registrarLog({
    acao: 'equipamento_criado',
    descricao: `Cadastrou o equipamento ${dados.name} em ${campus.name}`,
    entidade: 'equipment',
    entidade_id: criado.id,
  })

  revalidatePath('/equipamentos')
  voltar('/equipamentos', 'ok', `${dados.name} cadastrado.`)
}

export async function editarEquipamento(form: FormData) {
  const usuario = await exigirLogin()
  const atual = await carregarComPermissao(texto(form, 'id'), usuario)
  const caminho = `/equipamentos/${atual.id}`
  const { campus, dados } = await lerFormulario(form, caminho, usuario)

  const { error } = await getSupabase()
    .from('equipment')
    .update({ ...dados, updated_at: new Date().toISOString() })
    .eq('id', atual.id)
  if (error) voltar(caminho, 'erro', 'Não foi possível salvar: ' + error.message)

  const mudouCampus = atual.campus && atual.campus.id !== campus.id
  await registrarLog({
    acao: 'equipamento_editado',
    descricao: mudouCampus
      ? `Editou o equipamento ${dados.name} e moveu de ${atual.campus!.name} para ${campus.name}`
      : `Editou o equipamento ${dados.name} (${campus.name})`,
    entidade: 'equipment',
    entidade_id: atual.id,
  })

  revalidatePath('/equipamentos')
  voltar('/equipamentos', 'ok', mudouCampus ? `${dados.name} salvo e movido para ${campus.name}.` : `${dados.name} salvo.`)
}

// Dar baixa tira o equipamento do inventário em uso sem apagar o histórico; reativar devolve.
export async function alternarBaixa(form: FormData) {
  const usuario = await exigirLogin()
  const atual = await carregarComPermissao(texto(form, 'id'), usuario)
  const darBaixa = atual.status !== 'descartado'
  const retorno = texto(form, 'retorno')

  const { error } = await getSupabase()
    .from('equipment')
    .update({ status: darBaixa ? 'descartado' : 'ativo', updated_at: new Date().toISOString() })
    .eq('id', atual.id)
  if (error) voltar('/equipamentos', 'erro', 'Não foi possível salvar: ' + error.message)

  await registrarLog({
    acao: darBaixa ? 'equipamento_baixa' : 'equipamento_reativado',
    descricao: `${darBaixa ? 'Deu baixa no' : 'Reativou o'} equipamento ${atual.name}${atual.campus ? ` (${atual.campus.name})` : ''}`,
    entidade: 'equipment',
    entidade_id: atual.id,
  })

  revalidatePath('/equipamentos')
  voltarParaLista(retorno, 'ok', darBaixa ? `Baixa registrada: ${atual.name}.` : `${atual.name} reativado.`)
}

export async function excluirEquipamento(form: FormData) {
  const usuario = await exigirLogin()
  if (!podeExcluirEquipamento(usuario)) voltar('/equipamentos', 'erro', 'Só o ADM Ilan pode excluir equipamentos. Use "Dar baixa".')
  const atual = await carregarComPermissao(texto(form, 'id'), usuario)
  const supabase = getSupabase()
  const retorno = texto(form, 'retorno')

  // Excluir apagaria em cascata os chamados de reparo do equipamento, então nesse caso só deixa dar baixa
  const { count } = await supabase
    .from('maintenance_requests')
    .select('id', { count: 'exact', head: true })
    .eq('equipment_id', atual.id)
  if (count) {
    voltarParaLista(
      retorno,
      'erro',
      `${atual.name} tem ${count} ${count === 1 ? 'chamado de reparo' : 'chamados de reparo'} e não pode ser excluído. Use "Dar baixa" para tirá-lo do inventário sem perder o histórico.`
    )
  }

  const { error } = await supabase.from('equipment').delete().eq('id', atual.id)
  if (error) voltarParaLista(retorno, 'erro', 'Não foi possível excluir: ' + error.message)

  await registrarLog({
    acao: 'equipamento_excluido',
    descricao: `Excluiu o equipamento ${atual.name}${atual.campus ? ` (${atual.campus.name})` : ''}`,
    entidade: 'equipment',
    entidade_id: atual.id,
  })

  revalidatePath('/equipamentos')
  voltarParaLista(retorno, 'ok', `${atual.name} excluído.`)
}
