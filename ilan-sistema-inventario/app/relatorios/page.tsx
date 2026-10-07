import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { exigirLogin } from '@/lib/auth'
import { STATUS_LABELS, formatarMoeda } from '@/lib/equipamentos'
import { MANUTENCAO_STATUS_LABELS, STATUS_FINALIZADOS } from '@/lib/manutencoes'
import { EquipmentStatus, MaintenanceStatus } from '@/types/database'
import {
  FiltrosRelatorio,
  agrupar,
  buscarEquipamentos,
  buscarManutencoes,
  diasParaResolver,
  periodoPadrao,
} from '@/lib/relatorios'
import BotaoImprimir from './BotaoImprimir'
import NumeroAnimado from '@/components/NumeroAnimado'
import TextoRevelado from '@/components/TextoRevelado'

export const dynamic = 'force-dynamic'

const campoClass = 'px-3 py-2 border border-gray-300 rounded-lg'

function Indicador({ titulo, valor, detalhe, moeda }: { titulo: string; valor: string | number; detalhe?: string; moeda?: boolean }) {
  return (
    <div className="cartao bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-600">{titulo}</p>
      <p className="text-2xl font-bold mt-1">
        {typeof valor === 'number' ? <NumeroAnimado valor={valor} formato={moeda ? 'moeda' : undefined} /> : valor}
      </p>
      {detalhe && <p className="text-xs text-gray-500 mt-1">{detalhe}</p>}
    </div>
  )
}

function TabelaResumo({ titulo, linhas, comValor }: { titulo: string; linhas: { nome: string; total: number; valor: number }[]; comValor?: boolean }) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 overflow-x-auto break-inside-avoid">
      <h3 className="font-semibold p-4 border-b border-gray-100">{titulo}</h3>
      {linhas.length === 0 ? (
        <p className="p-4 text-sm text-gray-500">Nada no período.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            {linhas.map(l => (
              <tr key={l.nome}>
                <td className="px-4 py-2 capitalize">{l.nome}</td>
                <td className="px-4 py-2 text-right font-medium">{l.total}</td>
                {comValor && <td className="px-4 py-2 text-right whitespace-nowrap text-gray-600">{formatarMoeda(l.valor)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function formatarData(data: string) {
  return new Date(data.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export default async function Relatorios({ searchParams }: { searchParams: FiltrosRelatorio }) {
  await exigirLogin()
  const { de, ate } = periodoPadrao(searchParams)
  const filtros = { ...searchParams, de, ate }

  const [{ equipamentos, error: erroEquip }, { manutencoes, error: erroManut }, { data: campusList }] = await Promise.all([
    buscarEquipamentos(filtros),
    buscarManutencoes(filtros),
    getSupabase().from('campus').select('id, name').order('name'),
  ])
  const erro = erroEquip ?? erroManut
  const campusNome = campusList?.find(c => c.id === searchParams.campus)?.name

  // Inventário (equipamentos descartados não contam no patrimônio)
  const emUso = equipamentos.filter(e => e.status !== 'descartado')
  const patrimonio = emUso.reduce((s, e) => s + Number(e.value ?? 0), 0)
  const valor = (e: (typeof equipamentos)[number]) => Number(e.value ?? 0)
  const porCampus = agrupar(emUso, e => e.campus?.name ?? 'Sem campus', valor)
  const porCategoria = agrupar(emUso, e => e.category ?? 'Sem categoria', valor)
  const porStatus = agrupar(equipamentos, e => STATUS_LABELS[e.status as EquipmentStatus], valor)
  const porLocal = agrupar(emUso, e => e.location ?? 'Sem local', valor)

  // Manutenções do período
  const custoTotal = manutencoes.reduce((s, m) => s + Number(m.cost ?? 0), 0)
  const entregues = manutencoes.filter(m => m.status === 'entregue')
  const prazos = entregues.map(diasParaResolver).filter((d): d is number => d !== null)
  const mediaDias = prazos.length ? Math.round(prazos.reduce((s, d) => s + d, 0) / prazos.length) : null
  const emAberto = manutencoes.filter(m => !STATUS_FINALIZADOS.includes(m.status))
  const custo = (m: (typeof manutencoes)[number]) => Number(m.cost ?? 0)
  const manutPorStatus = agrupar(manutencoes, m => MANUTENCAO_STATUS_LABELS[m.status as MaintenanceStatus], custo)
  const manutPorCampus = agrupar(manutencoes, m => m.campus?.name ?? 'Sem campus', custo)
  const maisConsertados = agrupar(manutencoes, m => m.equipment?.name ?? 'Equipamento', custo).filter(l => l.total > 1).slice(0, 5)

  const exportar = (tipo: string) => {
    const p = new URLSearchParams({ tipo, de, ate })
    if (searchParams.campus) p.set('campus', searchParams.campus)
    return `/relatorios/exportar?${p}`
  }

  return (
    <div className="p-4 md:p-8 space-y-8 print:p-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            <TextoRevelado texto="Relatórios" />
          </h1>
          <p className="text-gray-600 mt-1">
            {campusNome ?? 'Todos os campus'} · manutenções de {formatarData(de)} a {formatarData(ate)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <a href={exportar('equipamentos')} className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white font-medium">
            Planilha de equipamentos
          </a>
          <a href={exportar('manutencoes')} className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white font-medium">
            Planilha de manutenções
          </a>
          <BotaoImprimir />
        </div>
      </div>

      <form className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-end gap-3 print:hidden">
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Campus
          <select name="campus" defaultValue={searchParams.campus ?? ''} className={campoClass}>
            <option value="">Todos</option>
            {campusList?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          De
          <input type="date" name="de" defaultValue={de} className={campoClass} />
        </label>
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Até
          <input type="date" name="ate" defaultValue={ate} className={campoClass} />
        </label>
        <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition">
          Gerar
        </button>
        <Link href="/relatorios" className="px-2 py-2 text-sm text-gray-600 hover:text-gray-900">Este mês</Link>
      </form>

      {erro && (
        <div className="aviso aviso-erro p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">Erro ao gerar o relatório: {erro.message}</div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Inventário</h2>
        <div className="cascata grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Indicador titulo="Equipamentos em uso" valor={emUso.length} />
          <Indicador titulo="Patrimônio" valor={patrimonio} moeda />
          <Indicador
            titulo="Com problema"
            valor={emUso.filter(e => e.status === 'danificado' || e.status === 'em_manutencao').length}
            detalhe="danificados ou em manutenção"
          />
          <Indicador titulo="Descartados" valor={equipamentos.length - emUso.length} />
        </div>
        <div className="cascata grid grid-cols-1 lg:grid-cols-2 gap-4">
          {!searchParams.campus && <TabelaResumo titulo="Por campus" linhas={porCampus} comValor />}
          <TabelaResumo titulo="Por categoria" linhas={porCategoria} comValor />
          <TabelaResumo titulo="Por situação" linhas={porStatus} comValor />
          <TabelaResumo titulo="Por local" linhas={porLocal} comValor />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Manutenções no período</h2>
        <div className="cascata grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Indicador titulo="Chamados abertos" valor={manutencoes.length} detalhe={`${emAberto.length} ainda em andamento`} />
          <Indicador titulo="Entregues" valor={entregues.length} />
          <Indicador titulo="Custo total" valor={custoTotal} moeda />
          <Indicador titulo="Tempo médio de conserto" valor={mediaDias === null ? '—' : `${mediaDias} ${mediaDias === 1 ? 'dia' : 'dias'}`} detalhe="da abertura até a entrega" />
        </div>
        <div className="cascata grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TabelaResumo titulo="Por status" linhas={manutPorStatus} comValor />
          {!searchParams.campus && <TabelaResumo titulo="Por campus" linhas={manutPorCampus} comValor />}
          {maisConsertados.length > 0 && <TabelaResumo titulo="Equipamentos que mais voltaram para conserto" linhas={maisConsertados} comValor />}
        </div>

        <section className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <h3 className="font-semibold p-4 border-b border-gray-100">Chamados do período</h3>
          {manutencoes.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Nenhum chamado aberto no período.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-2 font-semibold">Aberto em</th>
                  <th className="px-4 py-2 font-semibold">Equipamento</th>
                  <th className="px-4 py-2 font-semibold">Campus</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold text-right">Custo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {manutencoes.map(m => (
                  <tr key={m.id}>
                    <td className="px-4 py-2 whitespace-nowrap">{formatarData(m.created_at)}</td>
                    <td className="px-4 py-2">
                      <Link href={`/manutencoes/${m.id}`} className="text-indigo-700 hover:underline">{m.equipment?.name ?? 'Equipamento'}</Link>
                    </td>
                    <td className="px-4 py-2">{m.campus?.name}</td>
                    <td className="px-4 py-2">{MANUTENCAO_STATUS_LABELS[m.status]}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">{formatarMoeda(m.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </section>

      <p className="text-xs text-gray-400 hidden print:block">Gerado em {new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
    </div>
  )
}
