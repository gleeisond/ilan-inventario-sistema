import { Kpis, Painel, Selo } from './partes'

const OBRIGACOES = [
  { dia: '07/10', nome: 'Recolhimento do FGTS', situacao: 'Entregue', cor: 'bg-green-100 text-green-800' },
  { dia: '15/10', nome: 'eSocial · folha de setembro', situacao: 'Entregue', cor: 'bg-green-100 text-green-800' },
  { dia: '15/10', nome: 'EFD-Reinf', situacao: 'Entregue', cor: 'bg-green-100 text-green-800' },
  { dia: '20/10', nome: 'DCTFWeb e guia do INSS', situacao: 'Vence amanhã', cor: 'bg-amber-100 text-amber-800' },
  { dia: '31/10', nome: 'Prebendas de outubro', situacao: 'Agendado', cor: 'bg-gray-100 text-gray-700' },
]

const PESSOAS = [
  { nome: 'Pr. André Martins', vinculo: 'Prebenda', campus: 'Campus Centro', docs: 'Em dia' },
  { nome: 'Juliana Rocha', vinculo: 'CLT · Secretária', campus: 'Sede', docs: 'Em dia' },
  { nome: 'Pr. Marcos Lima', vinculo: 'Prebenda', campus: 'Campus Norte', docs: 'Em dia' },
  { nome: 'Bruno Alves', vinculo: 'Voluntário · Mídia', campus: 'Campus Sul', docs: 'Termo pendente' },
  { nome: 'Carla Mendes', vinculo: 'Voluntária · Recepção', campus: 'Campus Centro', docs: 'Em dia' },
]

const VENCIMENTOS = [
  { item: 'Laudo do Corpo de Bombeiros · Campus Norte', prazo: 'vence em 12 dias', cor: 'text-red-700' },
  { item: 'Certidão negativa federal (CND)', prazo: 'vence em 34 dias', cor: 'text-amber-700' },
  { item: 'Alvará de funcionamento · Campus Sul', prazo: 'vence em 3 meses', cor: 'text-gray-600' },
]

export default function PreviaPessoal() {
  return (
    <div className="space-y-4">
      <Kpis
        itens={[
          { titulo: 'Pastores com prebenda', valor: '6' },
          { titulo: 'Funcionários', valor: '4' },
          { titulo: 'Voluntários com termo', valor: '182 de 187', detalhe: '5 termos para assinar', destaque: 'text-amber-700' },
          { titulo: 'Próxima obrigação', valor: '20/10', detalhe: 'DCTFWeb e guia do INSS' },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Painel titulo="Obrigações de outubro">
          <ul className="divide-y divide-gray-100 text-sm">
            {OBRIGACOES.map(o => (
              <li key={o.nome} className="flex items-center gap-4 px-4 py-2.5">
                <span className="font-mono text-xs text-gray-500 w-12">{o.dia}</span>
                <span className="flex-1 text-gray-900">{o.nome}</span>
                <Selo texto={o.situacao} cor={o.cor} />
              </li>
            ))}
          </ul>
        </Painel>
        <Painel titulo="Documentos e licenças vencendo">
          <ul className="divide-y divide-gray-100 text-sm">
            {VENCIMENTOS.map(v => (
              <li key={v.item} className="px-4 py-2.5">
                <p className="text-gray-900">{v.item}</p>
                <p className={`text-xs font-medium ${v.cor}`}>{v.prazo}</p>
              </li>
            ))}
          </ul>
        </Painel>
      </div>
      <Painel titulo="Pessoas" acao="+ Cadastrar">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {PESSOAS.map(p => (
                <tr key={p.nome}>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{p.nome}</td>
                  <td className="px-4 py-2.5 text-gray-600">{p.vinculo}</td>
                  <td className="px-4 py-2.5 text-gray-600">{p.campus}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Selo texto={p.docs} cor={p.docs === 'Em dia' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Painel>
    </div>
  )
}
