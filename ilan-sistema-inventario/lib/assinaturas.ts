// lib/assinaturas.ts
// Assinaturas das igrejas: faturas espelhadas do Asaas, atraso e bloqueio (só no servidor)

import { getSupabase } from '@/lib/supabase'
import { CobrancaAsaas, asaas } from '@/lib/asaas'

// Dias de atraso a partir dos quais o acesso da igreja é bloqueado
export const DIAS_PARA_BLOQUEIO = 15

export type SituacaoCobranca = 'pendente' | 'paga' | 'vencida' | 'estornada' | 'cancelada'

export type Cobranca = {
  id: string
  igreja_id: string
  asaas_id: string
  valor: number
  vencimento: string
  situacao: SituacaoCobranca
  situacao_asaas: string | null
  forma: string | null
  pago_em: string | null
  link_fatura: string | null
}

export const SITUACAO_COBRANCA: Record<SituacaoCobranca, { nome: string; cor: string }> = {
  pendente: { nome: 'A vencer', cor: 'bg-gray-100 text-gray-700' },
  paga: { nome: 'Paga', cor: 'bg-green-100 text-green-800' },
  vencida: { nome: 'Vencida', cor: 'bg-red-100 text-red-800' },
  estornada: { nome: 'Estornada', cor: 'bg-amber-100 text-amber-800' },
  cancelada: { nome: 'Cancelada', cor: 'bg-gray-100 text-gray-500' },
}

// Data de hoje em Brasília (AAAA-MM-DD)
export function hoje() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export function somarDias(data: string, dias: number) {
  const d = new Date(data + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

function diasEntre(de: string, ate: string) {
  return Math.round((Date.parse(ate + 'T12:00:00Z') - Date.parse(de + 'T12:00:00Z')) / 86_400_000)
}

// Status do Asaas → situação da fatura no Genesis41
export function situacaoDoAsaas(status: string, excluida = false): SituacaoCobranca {
  if (excluida) return 'cancelada'
  if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED'].includes(status)) return 'paga'
  if (['OVERDUE', 'DUNNING_REQUESTED'].includes(status)) return 'vencida'
  if (status.startsWith('REFUND') || status.startsWith('CHARGEBACK') || status === 'AWAITING_CHARGEBACK_REVERSAL') return 'estornada'
  return 'pendente'
}

// Guarda (ou atualiza) a fatura do Asaas na igreja dona dela. Retorna a igreja ou null se não achou.
export async function registrarCobranca(c: CobrancaAsaas, excluida = false): Promise<string | null> {
  const supabase = getSupabase()
  // A igreja é achada pela assinatura, pelo cliente ou pela referência externa (id da igreja)
  let igreja: string | null = null
  if (c.subscription) {
    const { data } = await supabase.from('igrejas').select('id').eq('asaas_assinatura_id', c.subscription).maybeSingle()
    igreja = data?.id ?? null
  }
  if (!igreja && c.customer) {
    const { data } = await supabase.from('igrejas').select('id').eq('asaas_cliente_id', c.customer).maybeSingle()
    igreja = data?.id ?? null
  }
  if (!igreja && c.externalReference && /^[0-9a-f-]{36}$/i.test(c.externalReference)) {
    const { data } = await supabase.from('igrejas').select('id').eq('id', c.externalReference).maybeSingle()
    igreja = data?.id ?? null
  }
  if (!igreja) return null

  const situacao = situacaoDoAsaas(c.status, excluida || c.deleted === true)
  const { error } = await supabase.from('cobrancas').upsert(
    {
      igreja_id: igreja,
      asaas_id: c.id,
      valor: c.value,
      vencimento: c.dueDate,
      situacao,
      situacao_asaas: c.status,
      forma: c.billingType ?? null,
      pago_em: situacao === 'paga' ? (c.clientPaymentDate ?? c.paymentDate ?? hoje()) : null,
      link_fatura: c.invoiceUrl ?? null,
      atualizada_em: new Date().toISOString(),
    },
    { onConflict: 'asaas_id' }
  )
  if (error) throw new Error('Não foi possível guardar a fatura: ' + error.message)
  return igreja
}

// Traz do Asaas todas as faturas da assinatura da igreja
export async function sincronizarCobrancas(assinaturaId: string) {
  const cobrancas = await asaas.cobrancasDaAssinatura(assinaturaId)
  for (const c of cobrancas) await registrarCobranca(c)
  return cobrancas.length
}

export type SituacaoFinanceira = {
  // Fatura em aberto mais antiga já vencida
  atrasoDesde: string | null
  diasAtraso: number
  bloqueada: boolean
  // Data em que o acesso é (ou foi) bloqueado
  bloqueioEm: string | null
  liberadaAte: string | null
}

export function calcularSituacao(abertas: { vencimento: string }[], liberadaAte: string | null): SituacaoFinanceira {
  const dia = hoje()
  const vencidas = abertas.map(c => c.vencimento).filter(v => v < dia).sort()
  const atrasoDesde = vencidas[0] ?? null
  const diasAtraso = atrasoDesde ? diasEntre(atrasoDesde, dia) : 0
  const bloqueioEm = atrasoDesde ? somarDias(atrasoDesde, DIAS_PARA_BLOQUEIO) : null
  const liberada = Boolean(liberadaAte && liberadaAte >= dia)
  return { atrasoDesde, diasAtraso, bloqueada: diasAtraso >= DIAS_PARA_BLOQUEIO && !liberada, bloqueioEm, liberadaAte: liberada ? liberadaAte : null }
}

// Situação de uma igreja (usada a cada requisição para decidir se o acesso está bloqueado)
export async function situacaoFinanceira(igrejaId: string): Promise<SituacaoFinanceira> {
  const supabase = getSupabase()
  const [{ data: abertas }, { data: igreja }] = await Promise.all([
    supabase.from('cobrancas').select('vencimento').eq('igreja_id', igrejaId).in('situacao', ['pendente', 'vencida']),
    supabase.from('igrejas').select('liberada_ate').eq('id', igrejaId).maybeSingle(),
  ])
  return calcularSituacao((abertas ?? []) as { vencimento: string }[], (igreja?.liberada_ate as string | null) ?? null)
}

// Todas as faturas (painel da plataforma)
export async function todasAsCobrancas(igrejaId?: string): Promise<Cobranca[]> {
  let consulta = getSupabase().from('cobrancas').select('*').order('vencimento', { ascending: false })
  if (igrejaId) consulta = consulta.eq('igreja_id', igrejaId)
  const { data } = await consulta
  return (data ?? []) as Cobranca[]
}

// Aviso do Asaas (webhook). Idempotente: o mesmo evento pode chegar mais de uma vez.
export async function processarEvento(evento: { id?: string; event?: string; payment?: CobrancaAsaas }) {
  const supabase = getSupabase()
  if (!evento.id || !evento.event) return 'ignorado'
  const { error: repetido } = await supabase
    .from('asaas_eventos')
    .insert({ id: evento.id, evento: evento.event, asaas_cobranca_id: evento.payment?.id ?? null, dados: evento })
  if (repetido) return repetido.code === '23505' ? 'repetido' : Promise.reject(new Error(repetido.message))
  if (!evento.event.startsWith('PAYMENT_') || !evento.payment?.id) return 'ignorado'
  try {
    const igreja = await registrarCobranca(evento.payment, evento.event === 'PAYMENT_DELETED')
    if (!igreja) {
      await supabase.from('asaas_eventos').update({ erro: 'Nenhuma igreja ligada a esta cobrança' }).eq('id', evento.id)
      return 'sem igreja'
    }
    return 'registrado'
  } catch (e) {
    // Apaga o registro do evento para que a nova tentativa do Asaas seja processada de novo
    await supabase.from('asaas_eventos').delete().eq('id', evento.id)
    throw e
  }
}
