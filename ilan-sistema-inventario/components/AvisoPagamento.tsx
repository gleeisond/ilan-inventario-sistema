import type { SituacaoFinanceira } from '@/lib/assinaturas'

const dataBR = (d: string) => d.split('-').reverse().join('/')

// Faixa no topo para o administrador da igreja quando há fatura vencida, antes do bloqueio
export default function AvisoPagamento({ situacao }: { situacao: SituacaoFinanceira }) {
  return (
    <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 md:px-8">
      <strong className="font-semibold">Pagamento pendente.</strong> A mensalidade do Genesis41 venceu em {dataBR(situacao.atrasoDesde!)}.{' '}
      {situacao.liberadaAte
        ? `O acesso está liberado até ${dataBR(situacao.liberadaAte)}.`
        : `Se não for paga, o acesso da igreja será bloqueado em ${dataBR(situacao.bloqueioEm!)}.`}{' '}
      A fatura foi enviada para o e-mail de cobrança da igreja.
    </div>
  )
}
