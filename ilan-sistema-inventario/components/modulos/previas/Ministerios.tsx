import { Kpis, Painel, Selo } from './partes'

const ESCALA = [
  { ministerio: 'Mídia', funcao: 'Mesa de som', pessoa: 'Bruno Alves', situacao: 'Confirmado' },
  { ministerio: 'Mídia', funcao: 'Projeção', pessoa: 'Larissa Pinto', situacao: 'Confirmado' },
  { ministerio: 'Mídia', funcao: 'Transmissão', pessoa: 'Diego Nunes', situacao: 'Pediu troca' },
  { ministerio: 'Louvor', funcao: 'Ministro', pessoa: 'Renata Silva', situacao: 'Confirmado' },
  { ministerio: 'Louvor', funcao: 'Bateria', pessoa: 'Felipe Araújo', situacao: 'Aguardando' },
  { ministerio: 'Recepção', funcao: 'Porta principal', pessoa: 'Carla Mendes', situacao: 'Confirmado' },
]

const COR_SITUACAO: Record<string, string> = {
  Confirmado: 'bg-green-100 text-green-800',
  Aguardando: 'bg-gray-100 text-gray-700',
  'Pediu troca': 'bg-amber-100 text-amber-800',
}

const EQUIPAMENTOS = [
  { nome: 'Mesa de som digital', situacao: 'Disponível' },
  { nome: 'Projetor principal', situacao: 'Disponível' },
  { nome: 'Câmera de transmissão 2', situacao: 'Em manutenção' },
  { nome: 'Microfones sem fio (6)', situacao: 'Disponível' },
]

export default function PreviaMinisterios() {
  return (
    <div className="space-y-4">
      <Kpis
        itens={[
          { titulo: 'Voluntários ativos', valor: '187' },
          { titulo: 'Escalas deste mês', valor: '48' },
          { titulo: 'Confirmação', valor: '91%', detalhe: 'nas últimas 4 semanas', destaque: 'text-green-700' },
          { titulo: 'Próximo evento', valor: '25/10', detalhe: 'Conferência de jovens · 320 inscritos' },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
        <Painel titulo="Culto de domingo · 26/10 · 18h · Campus Centro" acao="Avisar no WhatsApp">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {ESCALA.map(e => (
                  <tr key={e.funcao}>
                    <td className="px-4 py-2.5 text-gray-500">{e.ministerio}</td>
                    <td className="px-4 py-2.5 text-gray-700">{e.funcao}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{e.pessoa}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Selo texto={e.situacao} cor={COR_SITUACAO[e.situacao]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Painel>
        <Painel titulo="Equipamentos reservados">
          <ul className="divide-y divide-gray-100 text-sm">
            {EQUIPAMENTOS.map(e => (
              <li key={e.nome} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-gray-900">{e.nome}</span>
                <Selo texto={e.situacao} cor={e.situacao === 'Disponível' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-800'} />
              </li>
            ))}
          </ul>
          <p className="px-4 pb-4 text-xs text-gray-500">
            A situação vem do módulo de Patrimônio: a câmera 2 tem um chamado de reparo aberto, então a escala sugere a câmera reserva.
          </p>
        </Painel>
      </div>
    </div>
  )
}
