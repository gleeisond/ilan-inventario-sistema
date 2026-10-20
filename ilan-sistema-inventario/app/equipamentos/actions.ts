'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { STATUS_LABELS, lerMoeda, podeCorrigirStatus, podeEditarNoCampus, podeExcluirEquipamento } from '@/lib/equipamentos'
import { STATUS_FINALIZADOS } from '@/lib/manutencoes'
import { EquipmentStatus } from '@/types/database'
import { exigirLogin, igrejaDoContexto, registrarLog } from '@/lib/auth'
import { daIgreja } from '@/lib/db'

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
// O status não vem daqui: ele muda pelos chamados, pela baixa ou pela correção do administrador.
async function lerFormulario(form: FormData, caminho: string, usuario: Awaited<ReturnType<typeof exigirLogin>>) {
  const name = texto(form, 'name')
  const campus_id = texto(form, 'campus_id')
  if (!name || !campus_id) voltar(caminho, 'erro', 'Preencha o nome e o campus.')

  const value = lerMoeda(texto(form, 'value'))
  if (value !== null && Number.isNaN(value)) voltar(caminho, 'erro', 'Valor inválido. Use só números, ex: 3500,00')

  const db = await daIgreja()
  const { data: campus } = await db.select('campus', 'id, name, region_id')
    .eq('id', campus_id)
    
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
      location: texto(form, 'location'),
      notes: texto(form, 'notes'),
    },
  }
}

type Atual = { id: string; name: string; status: string; campus: { id: string; name: string; region_id: string | null } | null }

// Busca o equipamento e confere se o usuário pode mexer nele
async function carregarComPermissao(id: string | null, usuario: Awaited<ReturnType<typeof exigirLogin>>) {
  if (!id) voltar('/equipamentos', 'erro', 'Equipamento não informado.')
  const db = await daIgreja()
  const { data } = await db.select('equipment', 'id, name, status, campus:campus_id (id, name, region_id)')
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

  const db = await daIgreja()
  const { data: criado, error } = await db.insert('equipment', { ...dados, status: 'ativo' }).select('id').single()
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

  const db = await daIgreja()
  const { error } = await db.update('equipment', { ...dados, updated_at: new Date().toISOString() })
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
// A baixa pede o motivo e encerra os chamados abertos do equipamento (não há o que consertar).
export async function alternarBaixa(form: FormData) {
  const usuario = await exigirLogin()
  const atual = await carregarComPermissao(texto(form, 'id'), usuario)
  const darBaixa = atual.status !== 'descartado'
  const retorno = texto(form, 'retorno')
  const motivo = texto(form, 'motivo')
  if (darBaixa && !motivo) voltar(`/equipamentos/${atual.id}`, 'erro', 'Informe o motivo da baixa.')

  const db = await daIgreja()
  const { error } = await db.update('equipment', { status: darBaixa ? 'descartado' : 'ativo', updated_at: new Date().toISOString() })
    .eq('id', atual.id)
  if (error) voltar('/equipamentos', 'erro', 'Não foi possível salvar: ' + error.message)

  let encerrados = 0
  if (darBaixa) {
    const { data: abertos } = await db.select('maintenance_requests', 'id')
      .eq('equipment_id', atual.id)
      .not('status', 'in', `(${STATUS_FINALIZADOS.join(',')})`)
    const hoje = new Date().toISOString().slice(0, 10)
    for (const chamado of (abertos ?? []) as { id: string }[]) {
      const { error: erroChamado } = await db.update('maintenance_requests', { status: 'descartado', actual_completion_date: hoje, updated_at: new Date().toISOString() })
        .eq('id', chamado.id)
      if (erroChamado) continue
      encerrados++
      // Sem login ligado não há quem registrar na linha do tempo do chamado (o log geral fica)
      if (usuario) {
        await db.insert('maintenance_logs', {
          maintenance_request_id: chamado.id,
          action_type: 'descartado',
          description: `Chamado encerrado porque o equipamento recebeu baixa: ${motivo}`,
          performed_by_id: usuario.id,
        })
      }
    }
  }

  const sufixoChamados = encerrados ? ` ${encerrados === 1 ? '1 chamado aberto foi encerrado' : `${encerrados} chamados abertos foram encerrados`}.` : ''
  await registrarLog({
    acao: darBaixa ? 'equipamento_baixa' : 'equipamento_reativado',
    descricao: `${darBaixa ? 'Deu baixa no' : 'Reativou o'} equipamento ${atual.name}${atual.campus ? ` (${atual.campus.name})` : ''}${darBaixa ? `. Motivo: ${motivo}.${sufixoChamados}` : ''}`,
    entidade: 'equipment',
    entidade_id: atual.id,
  })

  revalidatePath('/equipamentos')
  revalidatePath('/manutencoes')
  voltarParaLista(retorno, 'ok', darBaixa ? `Baixa registrada: ${atual.name}.${sufixoChamados}` : `${atual.name} reativado.`)
}

// Status que o administrador pode corrigir à mão. Descartado só pela baixa, que pede o motivo.
const STATUS_CORRIGIVEIS: EquipmentStatus[] = ['ativo', 'danificado', 'em_manutencao']

// Correção do administrador para quando o status sair do fluxo dos chamados. Exige justificativa e fica no log.
export async function corrigirStatus(form: FormData) {
  const usuario = await exigirLogin()
  const atual = await carregarComPermissao(texto(form, 'id'), usuario)
  const caminho = `/equipamentos/${atual.id}`
  if (!podeCorrigirStatus(usuario)) voltar(caminho, 'erro', 'Só o administrador pode corrigir o status.')
  const novo = texto(form, 'status') as EquipmentStatus | null
  const justificativa = texto(form, 'justificativa')
  if (!novo || !STATUS_CORRIGIVEIS.includes(novo)) voltar(caminho, 'erro', 'Status inválido.')
  if (!justificativa) voltar(caminho, 'erro', 'Explique por que o status está sendo corrigido.')
  if (novo === atual.status) voltar(caminho, 'erro', `O equipamento já está como ${STATUS_LABELS[novo]}.`)

  const db = await daIgreja()
  const { error } = await db.update('equipment', { status: novo, updated_at: new Date().toISOString() }).eq('id', atual.id)
  if (error) voltar(caminho, 'erro', 'Não foi possível salvar: ' + error.message)

  await registrarLog({
    acao: 'equipamento_status_corrigido',
    descricao: `Corrigiu o status de ${atual.name}: ${STATUS_LABELS[atual.status as EquipmentStatus] ?? atual.status} → ${STATUS_LABELS[novo]}. Justificativa: ${justificativa}`,
    entidade: 'equipment',
    entidade_id: atual.id,
  })

  revalidatePath('/equipamentos')
  voltar(caminho, 'ok', `Status corrigido para ${STATUS_LABELS[novo]}.`)
}

export async function excluirEquipamento(form: FormData) {
  const usuario = await exigirLogin()
  if (!podeExcluirEquipamento(usuario)) voltar('/equipamentos', 'erro', 'Só o administrador pode excluir equipamentos. Use "Dar baixa".')
  const atual = await carregarComPermissao(texto(form, 'id'), usuario)
  const db = await daIgreja()
  const retorno = texto(form, 'retorno')

  // Excluir apagaria em cascata os chamados de reparo do equipamento, então nesse caso só deixa dar baixa
  const { count } = await db.select('maintenance_requests', 'id', { count: 'exact', head: true })
    .eq('equipment_id', atual.id)
  if (count) {
    voltarParaLista(
      retorno,
      'erro',
      `${atual.name} tem ${count} ${count === 1 ? 'chamado de reparo' : 'chamados de reparo'} e não pode ser excluído. Use "Dar baixa" para tirá-lo do inventário sem perder o histórico.`
    )
  }

  const { error } = await db.delete('equipment').eq('id', atual.id)
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
