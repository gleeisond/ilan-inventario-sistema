import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { formatarMoeda } from '@/lib/equipamentos'
import {
  MANUTENCAO_STATUS_COLORS,
  MANUTENCAO_STATUS_LABELS,
  PRIORIDADE_COLORS,
  PRIORIDADE_LABELS,
  PRIORIDADE_ORDEM,
  STATUS_FINALIZADOS,
  descreverPrazo,
  diasDeAtraso,
  formatarData,
} from '@/lib/manutencoes'
import { MaintenanceStatus, PriorityLevel } from '@/types/database'

export const dynamic = 'force-dynamic'

type Filtros = { situacao?: string; campus?: string; prioridade?: string; criado?: string }

type ManutencaoLinha = {
  id: string
  problem_description: string
  status: MaintenanceStatus
  priority: PriorityLevel
  scheduled_completion_date: string | null
  cost: number | null
  created_at: string
  equipment: { name: string } | null
  campus: { name: string } | null
  assigned_to: { name: string } | null
}

const selectClass = 'px-3 py-2 border border-gray-300 rounded-lg'

export default async function Manutencoes({ searchParams }: { searchParams: Filtros }) {
  const supabase = getSupabase()
  const situacao = searchParams.situacao ?? 'abertas'

  let query = supabase
    .from('maintenance_requests')
    .select(
      'id, problem_description, status, priority, scheduled_completion_date, cost, created_at, equipment:equipment_id (name), campus:campus_id (name), assigned_to:assigned_to_id (name)'
    )
    .order('created_at', { ascending: false })

  if (situacao === 'abertas') query = query.not('status', 'in', `(${STATUS_FINALIZADOS.join(',')})`)
  else if (situacao === 'atrasadas') {
    const hoje = new Date().toISOString().slice(0, 10)
    query = query.not('status', 'in', `(${STATUS_FINALIZADOS.join(',')})`).lt('scheduled_completion_date', hoje)
  } else if (situacao !== 'todas') query = query.eq('status', situacao)
  if (searchParams.campus) query = query.eq('campus_id', searchParams.campus)
  if (searchParams.prioridade) query = query.eq('priority', searchParams.prioridade)

  const [{ data, error }, { data: campusList }] = await Promise.all([
    query,
    supabase.from('campus').select('id, name').order('name'),
  ])

  const manutencoes = ((data ?? []) as unknown as ManutencaoLinha[])
    .map(m => ({ ...m, atraso: STATUS_FINALIZADOS.includes(m.status) ? null : diasDeAtraso(m.scheduled_completion_date) }))
    .sort((a, b) =>
      // Em aberto: mais urgentes primeiro. Finalizadas mantêm a ordem por data.
      STATUS_FINALIZADOS.includes(a.status) || STATUS_FINALIZADOS.includes(b.status)
        ? 0
        : PRIORIDADE_ORDEM[a.priority] - PRIORIDADE_ORDEM[b.priority] || (b.atraso ?? -999) - (a.atraso ?? -999)
    )
  const temFiltro = situacao !== 'abertas' || Boolean(searchParams.campus || searchParams.prioridade)

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manutenções</h1>
          <p className="text-gray-600 mt-1">
            {manutencoes.length} {manutencoes.length === 1 ? 'chamado' : 'chamados'}
          </p>
        </div>
        <Link
          href="/manutencoes/criar"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          + Novo chamado
        </Link>
      </div>

      {searchParams.criado && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">
          Chamado aberto. O equipamento foi marcado como em manutenção.
        </div>
      )}

      <form className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Situação
          <select name="situacao" defaultValue={situacao} className={selectClass}>
            <option value="abertas">Em aberto</option>
            <option value="atrasadas">Atrasadas</option>
            <option value="todas">Todas</option>
            {Object.entries(MANUTENCAO_STATUS_LABELS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>{rotulo}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Campus
          <select name="campus" defaultValue={searchParams.campus ?? ''} className={selectClass}>
            <option value="">Todos</option>
            {campusList?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Prioridade
          <select name="prioridade" defaultValue={searchParams.prioridade ?? ''} className={selectClass}>
            <option value="">Todas</option>
            {Object.entries(PRIORIDADE_LABELS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>{rotulo}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition">
          Filtrar
        </button>
        {temFiltro && (
          <Link href="/manutencoes" className="text-sm text-indigo-600 hover:text-indigo-700 py-2">
            Limpar filtros
          </Link>
        )}
      </form>

      {error ? (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          Erro ao carregar manutenções: {error.message}
        </div>
      ) : manutencoes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          {temFiltro ? 'Nenhum chamado encontrado com esses filtros.' : 'Nenhuma manutenção em aberto.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Equipamento</th>
                <th className="px-4 py-3 font-semibold">Campus</th>
                <th className="px-4 py-3 font-semibold">Prioridade</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Previsão</th>
                <th className="px-4 py-3 font-semibold">Responsável</th>
                <th className="px-4 py-3 font-semibold text-right">Custo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {manutencoes.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-xs">
                    <Link href={`/manutencoes/${m.id}`} className="font-medium text-gray-900 hover:text-indigo-700">
                      {m.equipment?.name ?? 'Equipamento'}
                    </Link>
                    <div className="text-gray-500 truncate">{m.problem_description}</div>
                  </td>
                  <td className="px-4 py-3">{m.campus?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${PRIORIDADE_COLORS[m.priority]}`}>
                      {PRIORIDADE_LABELS[m.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block whitespace-nowrap px-2 py-1 rounded-full text-xs font-medium ${MANUTENCAO_STATUS_COLORS[m.status]}`}>
                      {MANUTENCAO_STATUS_LABELS[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>{formatarData(m.scheduled_completion_date)}</div>
                    {m.atraso !== null && (
                      <div className={`text-xs ${m.atraso > 0 ? 'text-red-700 font-medium' : 'text-gray-500'}`}>
                        {descreverPrazo(m.atraso)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{m.assigned_to?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{m.cost === null ? '—' : formatarMoeda(m.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
