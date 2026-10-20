'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabase } from '@/lib/supabase'
import { exigirSuperadmin, registrarLog } from '@/lib/auth'
import { ErroAsaas, asaas } from '@/lib/asaas'
import { hoje, registrarCobranca, sincronizarCobrancas, todasAsCobrancas } from '@/lib/assinaturas'
import { lerMoeda } from '@/lib/equipamentos'
import { PLANOS } from '@/lib/igrejas'
import { Igreja } from '@/types/database'

function texto(form: FormData, campo: string) {
  const valor = String(form.get(campo) ?? '').trim()
  return valor === '' ? null : valor
}

function voltar(igrejaId: string, param: 'erro' | 'salvo', mensagem: string): never {
  const caminho = `/plataforma/igrejas/${igrejaId}`
  revalidatePath(caminho)
  revalidatePath('/plataforma/assinaturas')
  redirect(`${caminho}?${param}=${encodeURIComponent(mensagem)}#assinatura`)
}

async function carregar(form: FormData) {
  await exigirSuperadmin()
  const id = texto(form, 'igreja_id')
  if (!id) redirect('/plataforma/igrejas?erro=' + encodeURIComponent('Igreja não informada.'))
  const { data } = await getSupabase().from('igrejas').select('*').eq('id', id).maybeSingle()
  if (!data) redirect('/plataforma/igrejas?erro=' + encodeURIComponent('Igreja não encontrada.'))
  return data as Igreja
}

// Erro do Asaas vira mensagem na tela; qualquer outro sobe
async function noAsaas<T>(igrejaId: string, acao: () => Promise<T>): Promise<T> {
  try {
    return await acao()
  } catch (e) {
    if (e instanceof ErroAsaas) voltar(igrejaId, 'erro', `Asaas: ${e.message}`)
    throw e
  }
}

const valorDaIgreja = (i: Igreja) => Number(i.valor_mensal ?? PLANOS[i.plano].valor)

const dadosCliente = (i: Igreja) => ({
  name: i.nome,
  cpfCnpj: i.cpf_cnpj!,
  email: i.email_cobranca,
  mobilePhone: i.telefone_cobranca,
  externalReference: i.id,
})

// Próxima data com o dia de vencimento escolhido (no mês atual se ainda não passou)
function proximoVencimento(dia: number) {
  const [a, m, d] = hoje().split('-').map(Number)
  const data = new Date(Date.UTC(a, m - 1 + (d >= dia ? 1 : 0), dia))
  return data.toISOString().slice(0, 10)
}

export async function salvarDadosCobranca(form: FormData) {
  const igreja = await carregar(form)
  const cpfCnpj = texto(form, 'cpf_cnpj')?.replace(/\D/g, '') ?? null
  if (cpfCnpj && cpfCnpj.length !== 11 && cpfCnpj.length !== 14) voltar(igreja.id, 'erro', 'CPF ou CNPJ inválido.')
  const valorTexto = texto(form, 'valor_mensal')
  const valor = valorTexto ? lerMoeda(valorTexto) : null
  if (valor !== null && (Number.isNaN(valor) || valor <= 0)) voltar(igreja.id, 'erro', 'Valor mensal inválido. Ex: 247,00')
  const dia = Number(texto(form, 'dia_vencimento') ?? 10)
  if (!Number.isInteger(dia) || dia < 1 || dia > 28) voltar(igreja.id, 'erro', 'Dia de vencimento deve ser de 1 a 28.')

  const novo: Igreja = {
    ...igreja,
    cpf_cnpj: cpfCnpj,
    email_cobranca: texto(form, 'email_cobranca'),
    telefone_cobranca: texto(form, 'telefone_cobranca')?.replace(/\D/g, '') ?? null,
    valor_mensal: valor,
    dia_vencimento: dia,
  }
  // Mantém o Asaas igual ao cadastro: dados do cliente e valor da assinatura
  if (novo.asaas_cliente_id && novo.cpf_cnpj) await noAsaas(igreja.id, () => asaas.atualizarCliente(novo.asaas_cliente_id!, dadosCliente(novo)))
  const mudouValor = valorDaIgreja(novo) !== valorDaIgreja(igreja)
  if (novo.asaas_assinatura_id && mudouValor) await noAsaas(igreja.id, () => asaas.atualizarValor(novo.asaas_assinatura_id!, valorDaIgreja(novo)))

  const { error } = await getSupabase()
    .from('igrejas')
    .update({
      cpf_cnpj: novo.cpf_cnpj,
      email_cobranca: novo.email_cobranca,
      telefone_cobranca: novo.telefone_cobranca,
      valor_mensal: novo.valor_mensal,
      dia_vencimento: novo.dia_vencimento,
      atualizada_em: new Date().toISOString(),
    })
    .eq('id', igreja.id)
  if (error) voltar(igreja.id, 'erro', `Não foi possível salvar: ${error.message}`)
  await registrarLog({ acao: 'igreja_editada', descricao: `Atualizou os dados de cobrança da igreja ${igreja.nome}`, entidade: 'igreja', entidade_id: igreja.id, igreja_id: null })
  voltar(igreja.id, 'salvo', mudouValor && novo.asaas_assinatura_id ? 'Dados salvos. O novo valor vale a partir da fatura em aberto.' : 'Dados de cobrança salvos.')
}

export async function criarAssinatura(form: FormData) {
  const igreja = await carregar(form)
  if (igreja.asaas_assinatura_id) voltar(igreja.id, 'erro', 'Esta igreja já tem assinatura.')
  if (!igreja.cpf_cnpj) voltar(igreja.id, 'erro', 'Preencha o CPF ou CNPJ da igreja antes de criar a assinatura.')

  const supabase = getSupabase()
  let cliente = igreja.asaas_cliente_id
  if (!cliente) {
    cliente = (await noAsaas(igreja.id, () => asaas.criarCliente(dadosCliente(igreja)))).id
    await supabase.from('igrejas').update({ asaas_cliente_id: cliente }).eq('id', igreja.id)
  }
  const vencimento = proximoVencimento(igreja.dia_vencimento)
  const assinatura = await noAsaas(igreja.id, () =>
    asaas.criarAssinatura({
      customer: cliente!,
      value: valorDaIgreja(igreja),
      nextDueDate: vencimento,
      description: `Genesis41 · plano ${PLANOS[igreja.plano].nome}`,
      externalReference: igreja.id,
    })
  )
  await supabase.from('igrejas').update({ asaas_assinatura_id: assinatura.id, atualizada_em: new Date().toISOString() }).eq('id', igreja.id)
  await noAsaas(igreja.id, () => sincronizarCobrancas(assinatura.id))
  await registrarLog({ acao: 'igreja_editada', descricao: `Criou a assinatura da igreja ${igreja.nome} no Asaas`, entidade: 'igreja', entidade_id: igreja.id, igreja_id: null })
  voltar(igreja.id, 'salvo', `Assinatura criada. Primeira fatura vence em ${vencimento.split('-').reverse().join('/')}.`)
}

export async function sincronizar(form: FormData) {
  const igreja = await carregar(form)
  if (!igreja.asaas_assinatura_id) voltar(igreja.id, 'erro', 'Esta igreja não tem assinatura.')
  const total = await noAsaas(igreja.id, () => sincronizarCobrancas(igreja.asaas_assinatura_id!))
  voltar(igreja.id, 'salvo', `${total} fatura(s) atualizada(s) com o Asaas.`)
}

export async function cancelarAssinatura(form: FormData) {
  const igreja = await carregar(form)
  if (!igreja.asaas_assinatura_id) voltar(igreja.id, 'erro', 'Esta igreja não tem assinatura.')
  await noAsaas(igreja.id, () => asaas.cancelarAssinatura(igreja.asaas_assinatura_id!))
  const supabase = getSupabase()
  await supabase.from('igrejas').update({ asaas_assinatura_id: null, atualizada_em: new Date().toISOString() }).eq('id', igreja.id)
  // Faturas futuras deixam de existir; as vencidas continuam como dívida
  await supabase.from('cobrancas').update({ situacao: 'cancelada', atualizada_em: new Date().toISOString() }).eq('igreja_id', igreja.id).eq('situacao', 'pendente').gte('vencimento', hoje())
  await registrarLog({ acao: 'igreja_editada', descricao: `Cancelou a assinatura da igreja ${igreja.nome}`, entidade: 'igreja', entidade_id: igreja.id, igreja_id: null })
  voltar(igreja.id, 'salvo', 'Assinatura cancelada. Faturas vencidas continuam em aberto.')
}

// Pagamento feito fora do Asaas (dinheiro, transferência direta)
export async function receberPorFora(form: FormData) {
  const igreja = await carregar(form)
  const asaasId = texto(form, 'asaas_id')
  const cobranca = (await todasAsCobrancas(igreja.id)).find(c => c.asaas_id === asaasId)
  if (!cobranca || !['pendente', 'vencida'].includes(cobranca.situacao)) voltar(igreja.id, 'erro', 'Fatura não encontrada ou já paga.')
  const atualizada = await noAsaas(igreja.id, () => asaas.receberEmDinheiro(cobranca.asaas_id, Number(cobranca.valor), hoje()))
  await registrarCobranca({ ...atualizada, subscription: atualizada.subscription ?? igreja.asaas_assinatura_id })
  await registrarLog({ acao: 'igreja_editada', descricao: `Registrou pagamento por fora da fatura de ${cobranca.vencimento} da igreja ${igreja.nome}`, entidade: 'igreja', entidade_id: igreja.id, igreja_id: null })
  voltar(igreja.id, 'salvo', 'Pagamento registrado.')
}

// Exceção: não bloqueia por atraso até a data escolhida (vazio tira a exceção)
export async function liberarAte(form: FormData) {
  const igreja = await carregar(form)
  const data = texto(form, 'liberada_ate')
  if (data && !/^\d{4}-\d{2}-\d{2}$/.test(data)) voltar(igreja.id, 'erro', 'Data inválida.')
  await getSupabase().from('igrejas').update({ liberada_ate: data }).eq('id', igreja.id)
  await registrarLog({
    acao: 'igreja_editada',
    descricao: data ? `Liberou o acesso da igreja ${igreja.nome} até ${data} apesar do atraso` : `Tirou a liberação por atraso da igreja ${igreja.nome}`,
    entidade: 'igreja',
    entidade_id: igreja.id,
    igreja_id: null,
  })
  voltar(igreja.id, 'salvo', data ? `Acesso liberado até ${data.split('-').reverse().join('/')}.` : 'Liberação retirada.')
}
