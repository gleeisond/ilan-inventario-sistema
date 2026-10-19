import { Barras, Kpis, Painel, Selo } from './partes'

const ANIVERSARIANTES = [
  { nome: 'Fernanda Costa', dia: 'Hoje', campus: 'Campus Centro' },
  { nome: 'Ricardo Teixeira', dia: 'Quarta, 22/10', campus: 'Campus Norte' },
  { nome: 'Patrícia Gomes', dia: 'Sexta, 24/10', campus: 'Campus Sul' },
  { nome: 'Lucas Ferreira', dia: 'Sábado, 25/10', campus: 'Campus Centro' },
]

const RECENTES = [
  { nome: 'Família Oliveira (4 pessoas)', evento: 'Ingresso por transferência', campus: 'Campus Norte', lgpd: true },
  { nome: 'Gabriel Santos', evento: 'Batismo · 05/10', campus: 'Campus Centro', lgpd: true },
  { nome: 'Aline Barbosa', evento: 'Novo membro', campus: 'Campus Sul', lgpd: false },
  { nome: 'Thiago Ribeiro', evento: 'Carta de transferência emitida', campus: 'Campus Oeste', lgpd: true },
]

export default function PreviaMembros() {
  return (
    <div className="space-y-4">
      <Kpis
        itens={[
          { titulo: 'Membros ativos', valor: '2.418' },
          { titulo: 'Novos em outubro', valor: '37', destaque: 'text-green-700' },
          { titulo: 'Batismos no ano', valor: '112' },
          { titulo: 'Consentimento LGPD', valor: '96%', detalhe: '97 cadastros sem aceite' },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
        <Painel titulo="Movimentações recentes" acao="+ Novo membro">
          <ul className="divide-y divide-gray-100 text-sm">
            {RECENTES.map(r => (
              <li key={r.nome} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span>
                  <span className="block text-gray-900">{r.nome}</span>
                  <span className="block text-xs text-gray-500">{r.evento} · {r.campus}</span>
                </span>
                <Selo texto={r.lgpd ? 'LGPD aceito' : 'Sem aceite'} cor={r.lgpd ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'} />
              </li>
            ))}
          </ul>
        </Painel>
        <Painel titulo="Aniversariantes da semana">
          <ul className="divide-y divide-gray-100 text-sm">
            {ANIVERSARIANTES.map(a => (
              <li key={a.nome} className="px-4 py-2.5">
                <p className="text-gray-900">{a.nome}</p>
                <p className="text-xs text-gray-500">{a.dia} · {a.campus}</p>
              </li>
            ))}
          </ul>
        </Painel>
      </div>
      <Painel titulo="Membros por campus">
        <Barras
          formatar={v => v.toLocaleString('pt-BR')}
          itens={[
            { rotulo: 'Campus Centro', valor: 1040 },
            { rotulo: 'Campus Norte', valor: 612 },
            { rotulo: 'Campus Sul', valor: 488 },
            { rotulo: 'Campus Oeste', valor: 278 },
          ]}
        />
      </Painel>
    </div>
  )
}
