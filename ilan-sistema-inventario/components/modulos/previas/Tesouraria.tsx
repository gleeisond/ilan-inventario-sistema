import { Barras, Kpis, Painel, Selo, moeda } from './partes'

const LANCAMENTOS = [
  { data: '12/10', campus: 'Campus Centro', descricao: 'Dízimos e ofertas · culto de domingo', categoria: 'Dízimos', valor: 18420, comprovante: 'Contagem conferida' },
  { data: '11/10', campus: 'Campus Norte', descricao: 'Conta de energia', categoria: 'Utilidades', valor: -2310, comprovante: 'Anexado' },
  { data: '11/10', campus: 'Campus Centro', descricao: 'Reparo da mesa de som (chamado aprovado)', categoria: 'Manutenção', valor: -1850, comprovante: 'Anexado' },
  { data: '10/10', campus: 'Campus Sul', descricao: 'Campanha Construção · PIX', categoria: 'Campanhas', valor: 6900, comprovante: 'Extrato' },
  { data: '09/10', campus: 'Campus Sul', descricao: 'Compra de material de limpeza', categoria: 'Materiais', valor: -640, comprovante: 'Pendente' },
]

const PRESTACAO = [
  { campus: 'Campus Centro', situacao: 'Enviada', cor: 'bg-green-100 text-green-800' },
  { campus: 'Campus Norte', situacao: 'Enviada', cor: 'bg-green-100 text-green-800' },
  { campus: 'Campus Sul', situacao: '1 comprovante pendente', cor: 'bg-amber-100 text-amber-800' },
  { campus: 'Campus Oeste', situacao: 'Não iniciada', cor: 'bg-gray-100 text-gray-700' },
]

export default function PreviaTesouraria() {
  return (
    <div className="space-y-4">
      <Kpis
        itens={[
          { titulo: 'Entradas em outubro', valor: moeda(184320), detalhe: '+6% sobre setembro' },
          { titulo: 'Saídas em outubro', valor: moeda(121870) },
          { titulo: 'Saldo das contas', valor: moeda(62450), destaque: 'text-green-700' },
          { titulo: 'Comprovantes pendentes', valor: '3', detalhe: 'Campus Sul e Oeste', destaque: 'text-amber-700' },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
        <Painel titulo="Últimos lançamentos" acao="+ Novo lançamento">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {LANCAMENTOS.map(l => (
                  <tr key={l.descricao}>
                    <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{l.data}</td>
                    <td className="px-4 py-2.5">
                      <p className="text-gray-900">{l.descricao}</p>
                      <p className="text-xs text-gray-500">{l.campus} · {l.categoria}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <Selo texto={l.comprovante} cor={l.comprovante === 'Pendente' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'} />
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono whitespace-nowrap ${l.valor < 0 ? 'text-red-700' : 'text-green-700'}`}>{moeda(l.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Painel>
        <div className="space-y-4">
          <Painel titulo="Entradas por campus">
            <Barras
              itens={[
                { rotulo: 'Campus Centro', valor: 78400 },
                { rotulo: 'Campus Norte', valor: 46200 },
                { rotulo: 'Campus Sul', valor: 38900 },
                { rotulo: 'Campus Oeste', valor: 20820 },
              ]}
            />
          </Painel>
          <Painel titulo="Prestação de contas de setembro">
            <ul className="divide-y divide-gray-100 text-sm">
              {PRESTACAO.map(p => (
                <li key={p.campus} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span>{p.campus}</span>
                  <Selo texto={p.situacao} cor={p.cor} />
                </li>
              ))}
            </ul>
          </Painel>
        </div>
      </div>
    </div>
  )
}
