import { Kpis, Painel, Selo, moeda } from './partes'

const RESULTADO = [
  { grupo: 'Receitas', linhas: [['Dízimos', 132400], ['Ofertas', 31720], ['Campanhas', 20200]] },
  { grupo: 'Despesas', linhas: [['Pessoal e prebendas', -58300], ['Aluguéis e utilidades', -27450], ['Manutenção de equipamentos', -6120], ['Depreciação do patrimônio', -4870], ['Missões e ação social', -18000]] },
] as const

const LANCAMENTOS = [
  { origem: 'Tesouraria', cor: 'bg-blue-100 text-blue-800', historico: 'Dízimos · Campus Centro · 12/10', debito: '1.1.1 Caixa', credito: '3.1.1 Dízimos', valor: 18420 },
  { origem: 'Patrimônio', cor: 'bg-ouro-100 text-ouro-800', historico: 'Depreciação mensal · 214 bens', debito: '4.2.9 Depreciação', credito: '1.2.3 Depreciação acumulada', valor: 4870 },
  { origem: 'Tesouraria', cor: 'bg-blue-100 text-blue-800', historico: 'Reparo da mesa de som · chamado aprovado', debito: '4.2.4 Manutenção', credito: '1.1.2 Banco', valor: 1850 },
  { origem: 'Pessoal', cor: 'bg-teal-100 text-teal-800', historico: 'Prebendas de outubro', debito: '4.1.1 Prebendas', credito: '2.1.3 Prebendas a pagar', valor: 32000 },
]

const CHECKLIST = [
  { item: 'Extratos bancários conciliados', feito: true },
  { item: 'Prestação de contas de todos os campus', feito: false },
  { item: 'Depreciação do patrimônio calculada', feito: true },
  { item: 'Folha e prebendas lançadas', feito: true },
  { item: 'Revisão do contador', feito: false },
]

const CLIENTES = [
  { igreja: 'ILAN Church', situacao: 'Fechando outubro', cor: 'bg-amber-100 text-amber-800' },
  { igreja: 'Igreja Batista Esperança', situacao: 'Setembro fechado', cor: 'bg-green-100 text-green-800' },
  { igreja: 'Comunidade Vida Nova', situacao: '4 pendências', cor: 'bg-red-100 text-red-800' },
]

export default function PreviaContabilidade() {
  const total = (sinal: 'Receitas' | 'Despesas') =>
    RESULTADO.find(g => g.grupo === sinal)!.linhas.reduce((s, [, v]) => s + v, 0)
  const superavit = total('Receitas') + total('Despesas')
  const feitos = CHECKLIST.filter(c => c.feito).length

  return (
    <div className="space-y-4">
      <Kpis
        itens={[
          { titulo: 'Superávit de outubro', valor: moeda(superavit), destaque: 'text-green-700' },
          { titulo: 'Lançamentos automáticos', valor: '94%', detalhe: '412 de 438 vieram dos outros módulos' },
          { titulo: 'Fechamento do mês', valor: `${feitos} de ${CHECKLIST.length}`, detalhe: 'etapas concluídas' },
          { titulo: 'Igrejas no portal', valor: '3', detalhe: 'clientes da Elshaddai' },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Painel titulo="Demonstração do resultado · outubro" acao="Exportar PDF">
          <table className="w-full text-sm">
            {RESULTADO.map(g => (
              <tbody key={g.grupo} className="divide-y divide-gray-100">
                <tr className="bg-gray-50">
                  <td className="px-4 py-2 font-semibold">{g.grupo}</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold">{moeda(total(g.grupo))}</td>
                </tr>
                {g.linhas.map(([nome, valor]) => (
                  <tr key={nome}>
                    <td className="px-4 py-2 pl-8 text-gray-700">{nome}</td>
                    <td className="px-4 py-2 text-right font-mono text-gray-900">{moeda(valor)}</td>
                  </tr>
                ))}
              </tbody>
            ))}
            <tbody>
              <tr className="border-t-2 border-gray-200">
                <td className="px-4 py-2.5 font-semibold">Superávit do período</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">{moeda(superavit)}</td>
              </tr>
            </tbody>
          </table>
        </Painel>
        <div className="space-y-4">
          <Painel titulo="Fechamento de outubro">
            <ul className="p-4 space-y-2 text-sm">
              {CHECKLIST.map(c => (
                <li key={c.item} className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-bold ${c.feito ? 'bg-ouro-400 text-gray-900' : 'border-2 border-gray-300'}`}
                    aria-hidden="true"
                  >
                    {c.feito ? '✓' : ''}
                  </span>
                  <span className={c.feito ? 'text-gray-500 line-through' : 'text-gray-900'}>{c.item}</span>
                </li>
              ))}
            </ul>
          </Painel>
          <Painel titulo="Portal do contador">
            <ul className="divide-y divide-gray-100 text-sm">
              {CLIENTES.map(c => (
                <li key={c.igreja} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span>{c.igreja}</span>
                  <Selo texto={c.situacao} cor={c.cor} />
                </li>
              ))}
            </ul>
          </Painel>
        </div>
      </div>
      <Painel titulo="Lançamentos gerados pelos outros módulos" acao="Revisar 26 pendentes">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Origem</th>
                <th className="px-4 py-2 font-medium">Histórico</th>
                <th className="px-4 py-2 font-medium">Débito</th>
                <th className="px-4 py-2 font-medium">Crédito</th>
                <th className="px-4 py-2 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {LANCAMENTOS.map(l => (
                <tr key={l.historico}>
                  <td className="px-4 py-2.5"><Selo texto={l.origem} cor={l.cor} /></td>
                  <td className="px-4 py-2.5 text-gray-900">{l.historico}</td>
                  <td className="px-4 py-2.5 text-gray-600 font-mono text-xs whitespace-nowrap">{l.debito}</td>
                  <td className="px-4 py-2.5 text-gray-600 font-mono text-xs whitespace-nowrap">{l.credito}</td>
                  <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap">{moeda(l.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Painel>
    </div>
  )
}
