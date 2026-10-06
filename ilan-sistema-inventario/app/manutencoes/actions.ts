'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabase } from '@/lib/supabase'
import { lerMoeda } from '@/lib/equipamentos'
import { ACAO_POR_STATUS, MANUTENCAO_STATUS_LABELS, PRIORIDADE_LABELS, STATUS_FINALIZADOS } from '@/lib/manutencoes'
import { MaintenanceStatus, PriorityLevel } from '@/types/database'
import { exigirLogin, registrarLog } from '@/lib/auth'

function texto(form: FormData, campo: string) {
  const valor = String(form.get(campo) ?? '').trim()
  return valor === '' ? null : valor
}

function voltarCom(caminho: string, erro: string): never {
  redirect(`${caminho}?erro=${encodeURIComponent(erro)}`)
}

// Quem está agindo: o usuário logado ou, com o login desligado, a pessoa escolhida no formulário
async function autor(idEscolhido: string | null) {
  const logado = await exigirLogin()
  if (logado) return logado
  if (!idEscolhido) return null
  const { data } = await getSupabase().from('users').select('id, name').eq('id', idEscolhido).maybeSingle()
  return data
}

function revalidarTelas() {
  revalidatePath('/manutencoes')
  revalidatePath('/equipamentos')
  revalidatePath('/dashboard')
}

export async function criarManutencao(form: FormData) {
  const supabase = getSupabase()
  const equipment_id = texto(form, 'equipment_id')
  const problem_description = texto(form, 'problem_description')
  const quem = await autor(texto(form, 'created_by_id'))
  const created_by_id = quem?.id

  if (!equipment_id || !problem_description || !created_by_id) {
    voltarCom('/manutencoes/criar', 'Preencha o equipamento, o problema e quem está abrindo o chamado.')
  }

  // O chamado fica no campus onde o equipamento está
  const { data: equipamento, error: erroEquip } = await supabase
    .from('equipment')
    .select('name, campus_id, status')
    .eq('id', equipment_id)
    .single()
  if (erroEquip || !equipamento) voltarCom('/manutencoes/criar', 'Equipamento não encontrado.')

  const priority = texto(form, 'priority') ?? 'media'
  const { data: chamado, error } = await supabase
    .from('maintenance_requests')
    .insert({
      equipment_id,
      campus_id: equipamento.campus_id,
      created_by_id,
      problem_description,
      priority,
      assigned_to_id: texto(form, 'assigned_to_id'),
      scheduled_completion_date: texto(form, 'scheduled_completion_date'),
      notes: texto(form, 'notes'),
    })
    .select('id')
    .single()
  if (error) voltarCom('/manutencoes/criar', 'Não foi possível abrir o chamado: ' + error.message)

  await registrarLog({
    acao: 'manutencao_aberta',
    descricao: `Abriu chamado para ${equipamento.name} (prioridade ${PRIORIDADE_LABELS[priority as PriorityLevel] ?? priority}): ${problem_description}`,
    entidade: 'maintenance_request',
    entidade_id: chamado.id,
    usuario: quem,
  })

  if (equipamento.status !== 'descartado') {
    await supabase.from('equipment').update({ status: 'em_manutencao' }).eq('id', equipment_id)
  }

  revalidarTelas()
  redirect('/manutencoes?criado=1')
}

export async function atualizarManutencao(form: FormData) {
  const supabase = getSupabase()
  const id = texto(form, 'id')
  if (!id) redirect('/manutencoes')
  const pagina = `/manutencoes/${id}`

  const { data: atual, error: erroAtual } = await supabase
    .from('maintenance_requests')
    .select('status, equipment_id, equipment:equipment_id (name)')
    .eq('id', id)
    .single()
  if (erroAtual || !atual) voltarCom(pagina, 'Chamado não encontrado.')

  const novoStatus = (texto(form, 'status') ?? atual.status) as MaintenanceStatus
  const mudouStatus = novoStatus !== atual.status
  const quem = mudouStatus ? await autor(texto(form, 'performed_by_id')) : await exigirLogin()
  const performed_by_id = quem?.id ?? null
  const comentario = texto(form, 'comentario')

  if (mudouStatus && !performed_by_id) voltarCom(pagina, 'Informe quem está registrando a mudança de status.')

  const cost = lerMoeda(texto(form, 'cost'))
  if (cost !== null && Number.isNaN(cost)) voltarCom(pagina, 'Custo inválido. Use só números, ex: 350,00')

  const hoje = new Date().toISOString().slice(0, 10)
  const { error } = await supabase
    .from('maintenance_requests')
    .update({
      status: novoStatus,
      priority: texto(form, 'priority') ?? undefined,
      assigned_to_id: texto(form, 'assigned_to_id'),
      scheduled_completion_date: texto(form, 'scheduled_completion_date'),
      cost,
      notes: texto(form, 'notes'),
      ...(mudouStatus && { actual_completion_date: novoStatus === 'entregue' ? hoje : null }),
    })
    .eq('id', id)
  if (error) voltarCom(pagina, 'Não foi possível salvar: ' + error.message)

  const nomeEquipamento = (atual as unknown as { equipment: { name: string } | null }).equipment?.name ?? 'equipamento'
  await registrarLog({
    acao: 'manutencao_atualizada',
    descricao: mudouStatus
      ? `Mudou o chamado de ${nomeEquipamento}: ${MANUTENCAO_STATUS_LABELS[atual.status as MaintenanceStatus]} → ${MANUTENCAO_STATUS_LABELS[novoStatus]}${comentario ? ` (${comentario})` : ''}`
      : `Editou os dados do chamado de ${nomeEquipamento}`,
    entidade: 'maintenance_request',
    entidade_id: id,
    ...(quem && { usuario: quem }),
  })

  if (mudouStatus) {
    const acao = ACAO_POR_STATUS[novoStatus]
    if (acao && performed_by_id) {
      const resumo = `${MANUTENCAO_STATUS_LABELS[atual.status as MaintenanceStatus]} → ${MANUTENCAO_STATUS_LABELS[novoStatus]}`
      await supabase.from('maintenance_logs').insert({
        maintenance_request_id: id,
        action_type: acao,
        description: comentario ? `${resumo}: ${comentario}` : resumo,
        performed_by_id,
      })
    }

    // Mantém o status do equipamento coerente com os chamados dele
    const finalizou = STATUS_FINALIZADOS.includes(novoStatus)
    if (finalizou) {
      const { count } = await supabase
        .from('maintenance_requests')
        .select('id', { count: 'exact', head: true })
        .eq('equipment_id', atual.equipment_id)
        .not('status', 'in', `(${STATUS_FINALIZADOS.join(',')})`)
      if (!count) {
        await supabase.from('equipment').update({ status: 'ativo' }).eq('id', atual.equipment_id).eq('status', 'em_manutencao')
      }
    } else {
      await supabase.from('equipment').update({ status: 'em_manutencao' }).eq('id', atual.equipment_id).neq('status', 'descartado')
    }
  }

  revalidarTelas()
  redirect(`${pagina}?salvo=1`)
}
