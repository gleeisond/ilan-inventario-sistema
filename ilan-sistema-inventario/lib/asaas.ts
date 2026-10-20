// lib/asaas.ts
// Cliente da API do Asaas (só no servidor). Documentação: https://docs.asaas.com
//
// Variáveis na Vercel:
//   ASAAS_API_KEY        chave da conta (começa com $aact_prod_ ou $aact_hmlg_ no sandbox)
//   ASAAS_AMBIENTE       "producao" ou "sandbox" (padrão: sandbox, para não cobrar ninguém por engano)
//   ASAAS_WEBHOOK_TOKEN  token que o Asaas manda no cabeçalho asaas-access-token dos avisos
//   ASAAS_URL            opcional: outra URL base (usada nos testes com um Asaas simulado)

const URLS = { producao: 'https://api.asaas.com/v3', sandbox: 'https://api-sandbox.asaas.com/v3' }

export function asaasConfigurado() {
  return Boolean(process.env.ASAAS_API_KEY)
}

export function ambienteAsaas(): 'producao' | 'sandbox' {
  return process.env.ASAAS_AMBIENTE === 'producao' ? 'producao' : 'sandbox'
}

export class ErroAsaas extends Error {}

async function chamar<T>(metodo: 'GET' | 'POST' | 'PUT' | 'DELETE', caminho: string, corpo?: unknown): Promise<T> {
  const chave = process.env.ASAAS_API_KEY
  if (!chave) throw new ErroAsaas('ASAAS_API_KEY não configurada na Vercel.')
  const base = process.env.ASAAS_URL || URLS[ambienteAsaas()]
  const resposta = await fetch(base + caminho, {
    method: metodo,
    headers: {
      access_token: chave,
      'Content-Type': 'application/json',
      // Obrigatório para contas criadas a partir de 13/06/2024
      'User-Agent': 'Genesis41/1.0',
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    cache: 'no-store',
  })
  const texto = await resposta.text()
  const dados = texto ? JSON.parse(texto) : {}
  if (!resposta.ok) {
    const mensagens = (dados?.errors as { description?: string }[] | undefined)?.map(e => e.description).filter(Boolean)
    throw new ErroAsaas(mensagens?.length ? mensagens.join(' ') : `Asaas respondeu ${resposta.status}.`)
  }
  return dados as T
}

export type ClienteAsaas = { id: string }
export type AssinaturaAsaas = { id: string; status: string; value: number; nextDueDate: string }
export type CobrancaAsaas = {
  id: string
  customer: string
  subscription?: string | null
  value: number
  dueDate: string
  status: string
  billingType?: string
  paymentDate?: string | null
  clientPaymentDate?: string | null
  invoiceUrl?: string | null
  externalReference?: string | null
  deleted?: boolean
}

type DadosCliente = { name: string; cpfCnpj: string; email?: string | null; mobilePhone?: string | null; externalReference: string }

const semVazios = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== ''))

export const asaas = {
  criarCliente: (d: DadosCliente) => chamar<ClienteAsaas>('POST', '/customers', semVazios(d)),
  atualizarCliente: (id: string, d: DadosCliente) => chamar<ClienteAsaas>('PUT', `/customers/${id}`, semVazios(d)),
  // billingType UNDEFINED: a igreja escolhe boleto, PIX ou cartão na própria fatura
  criarAssinatura: (d: { customer: string; value: number; nextDueDate: string; description: string; externalReference: string }) =>
    chamar<AssinaturaAsaas>('POST', '/subscriptions', { ...d, billingType: 'UNDEFINED', cycle: 'MONTHLY' }),
  // updatePendingPayments: o novo valor vale também para a fatura já gerada e ainda não paga
  atualizarValor: (id: string, value: number) => chamar<AssinaturaAsaas>('PUT', `/subscriptions/${id}`, { value, updatePendingPayments: true }),
  cancelarAssinatura: (id: string) => chamar<{ deleted: boolean }>('DELETE', `/subscriptions/${id}`),
  cobrancasDaAssinatura: (id: string) =>
    chamar<{ data: CobrancaAsaas[] }>('GET', `/payments?subscription=${encodeURIComponent(id)}&limit=100`).then(r => r.data),
  receberEmDinheiro: (id: string, value: number, paymentDate: string) =>
    chamar<CobrancaAsaas>('POST', `/payments/${id}/receiveInCash`, { paymentDate, value, notifyCustomer: false }),
}
