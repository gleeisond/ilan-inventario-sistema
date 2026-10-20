import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { asaasConfigurado, ambienteAsaas } from '@/lib/asaas'
import { calcularSituacao, hoje, todasAsCobrancas } from '@/lib/assinaturas'
import { PLANOS, SITUACOES } from '@/lib/igrejas'
import { Igreja } from '@/types/database'

export const dynamic = 'force-dynamic'

const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dataBR = (d: string) => d.split('-').reverse().join('/')

// Visão geral das assinaturas: quanto entra por mês, quem pagou e quem está atrasado
export default async function Assinaturas() {
  const [{ data }, cobrancas] = await Promise.all([getSupabase().from('igrejas').select('*').order('nome'), todasAsCobrancas()])
  const igrejas = (data ?? []) as Igreja[]
  const dia = hoje()
  const mes = dia.slice(0, 7)
  const valor = (i: Igreja) => Number(i.valor_mensal ?? PLANOS[i.plano].valor)

  const linhas = igrejas.map(i => {
    const daIgreja = cobrancas.filter(c => c.igreja_id === i.id)
    const abertas = daIgreja.filter(c => c.situacao === 'pendente' || c.situacao === 'vencida')
    const proxima = abertas.map(c => c.vencimento).filter(v => v >= dia).sort()[0] ?? null
    const ultimaPaga = daIgreja.filter(c => c.situacao === 'paga' && c.pago_em).map(c => c.pago_em!).sort().pop() ?? null
    return { igreja: i, financeiro: calcularSituacao(abertas, i.liberada_ate), proxima, ultimaPaga }
  })
  const ativas = igrejas.filter(i => i.asaas_assinatura_id)
  const kpis = [
    { titulo: 'Receita mensal', valor: moeda(ativas.reduce((s, i) => s + valor(i), 0)), detalhe: `${ativas.length} assinatura${ativas.length === 1 ? '' : 's'} ativa${ativas.length === 1 ? '' : 's'}` },
    { titulo: 'Recebido neste mês', valor: moeda(cobrancas.filter(c => c.situacao === 'paga' && c.pago_em?.startsWith(mes)).reduce((s, c) => s + Number(c.valor), 0)) },
    { titulo: 'A vencer', valor: moeda(cobrancas.filter(c => c.situacao === 'pendente' && c.vencimento >= dia).reduce((s, c) => s + Number(c.valor), 0)) },
    {
      titulo: 'Em atraso',
      valor: moeda(cobrancas.filter(c => c.situacao === 'vencida' || (c.situacao === 'pendente' && c.vencimento < dia)).reduce((s, c) => s + Number(c.valor), 0)),
      detalhe: `${linhas.filter(l => l.financeiro.atrasoDesde).length} igreja(s), ${linhas.filter(l => l.financeiro.bloqueada).length} bloqueada(s)`,
      destaque: 'text-red-700',
    },
  ]

  return (
    <div className="space-y-6">
      {!asaasConfigurado() && (
        <p className="aviso rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          O Asaas ainda não está configurado. Coloque ASAAS_API_KEY, ASAAS_AMBIENTE e ASAAS_WEBHOOK_TOKEN nas variáveis da Vercel.
        </p>
      )}
      {asaasConfigurado() && ambienteAsaas() === 'sandbox' && (
        <p className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600">Asaas em modo sandbox: as cobranças são de teste.</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 cascata">
        {kpis.map(k => (
          <div key={k.titulo} className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-gray-600">{k.titulo}</p>
            <p className={`text-2xl font-bold mt-1 font-titulo ${k.destaque ?? 'text-gray-900'}`}>{k.valor}</p>
            {k.detalhe && <p className="text-xs text-gray-500 mt-1">{k.detalhe}</p>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-5 py-3 font-semibold">Igreja</th>
              <th className="px-5 py-3 font-semibold">Plano</th>
              <th className="px-5 py-3 font-semibold text-right">Mensalidade</th>
              <th className="px-5 py-3 font-semibold">Assinatura</th>
              <th className="px-5 py-3 font-semibold">Pagamento</th>
              <th className="px-5 py-3 font-semibold">Próximo vencimento</th>
              <th className="px-5 py-3 font-semibold">Último pagamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {linhas.map(({ igreja: i, financeiro: f, proxima, ultimaPaga }) => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <Link href={`/plataforma/igrejas/${i.id}#assinatura`} className="font-medium text-gray-900 hover:text-ouro-700">{i.nome}</Link>
                  <p className="text-xs text-gray-500">{SITUACOES[i.situacao].nome}</p>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">{PLANOS[i.plano].nome}</td>
                <td className="px-5 py-3 text-right font-mono whitespace-nowrap">{moeda(valor(i))}</td>
                <td className="px-5 py-3 whitespace-nowrap">{i.asaas_assinatura_id ? 'Ativa' : <span className="text-gray-500">Sem assinatura</span>}</td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      f.bloqueada ? 'bg-red-100 text-red-800' : f.atrasoDesde ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {f.bloqueada ? 'Bloqueada' : f.atrasoDesde ? `Atrasada ${f.diasAtraso}d` : 'Em dia'}
                  </span>
                  {f.liberadaAte && <span className="ml-2 text-xs text-gray-500">liberada até {dataBR(f.liberadaAte)}</span>}
                </td>
                <td className="px-5 py-3 text-gray-600">{proxima ? dataBR(proxima) : '—'}</td>
                <td className="px-5 py-3 text-gray-600">{ultimaPaga ? dataBR(ultimaPaga) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
