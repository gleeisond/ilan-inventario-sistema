import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { STATUS_COLORS, STATUS_LABELS, formatarMoeda } from '@/lib/equipamentos'
import {
  MANUTENCAO_STATUS_LABELS,
  PRIORIDADE_COLORS,
  PRIORIDADE_LABELS,
  PRIORIDADE_ORDEM,
  STATUS_FINALIZADOS,
  diasDeAtraso,
} from '@/lib/manutencoes'
import { EquipmentStatus, MaintenanceStatus, PriorityLevel } from '@/types/database'

export const dynamic = 'force-dynamic'

type Equipamento = { id: string; status: EquipmentStatus; value: number | null; campus_id: string }

type Manutencao = {
  id: string
  status: MaintenanceStatus
  priority: PriorityLevel
  problem_description: string
  scheduled_completion_date: string | null
  campus_id: string
  equipment: { name: string } | null
  campus: { name: string } | null
}

function Indicador({ titulo, valor, detalhe, destaque }: { titulo: string; valor: string | number; detalhe?: string; destaque?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <p className="text-sm text-gray-600">{titulo}</p>
      <p className={`text-3xl font-bold mt-1 ${destaque ?? 'text-gray-900'}`}>{valor}</p>
      {detalhe && <p className="text-xs text-gray-500 mt-1">{detalhe}</p>}
    </div>
  )
}

export default async function Dashboard() {
  const supabase = getSupabase()

  const [equipRes, manutRes, campusRes] = await Promise.all([
    supabase.from('equipment').select('id, status, value, campus_id'),
    supabase
      .from('maintenance_requests')
      .select('id, status, priority, problem_description, scheduled_completion_date, campus_id, equipment:equipment_id (name), campus:campus_id (name)'),
    supabase.from('campus').select('id, name').order('name'),
  ])

  const erro = equipRes.error ?? manutRes.error ?? campusRes.error
  if (erro) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          Erro ao carregar o dashboard: {erro.message}
        </div>
      </div>
    )
  }

  const equipamentos = (equipRes.data ?? []) as Equipamento[]
  const manutencoes = (manutRes.data ?? []) as unknown as Manutencao[]
  const campusList = campusRes.data ?? []

  // Inventário
  const emUso = equipamentos.filter(e => e.status !== 'descartado')
  const valorTotal = emUso.reduce((soma, e) => soma + Number(e.value ?? 0), 0)
  const porStatus = (Object.keys(STATUS_LABELS) as EquipmentStatus[]).map(status => ({
    status,
    total: equipamentos.filter(e => e.status === status).length,
  }))

  // Manutenções em andamento
  const pendentes = manutencoes
    .filter(m => !STATUS_FINALIZADOS.includes(m.status))
    .map(m => ({ ...m, atraso: diasDeAtraso(m.scheduled_completion_date) }))
    .sort((a, b) => PRIORIDADE_ORDEM[a.priority] - PRIORIDADE_ORDEM[b.priority] || (b.atraso ?? -999) - (a.atraso ?? -999))
  const atrasadas = pendentes.filter(m => (m.atraso ?? 0) > 0)
  const prontas = pendentes.filter(m => m.status === 'pronto')
  const criticas = pendentes.filter(m => m.priority === 'critica' || m.priority === 'alta')

  // Resumo por campus
  const porCampus = campusList
    .map(c => {
      const doCampus = emUso.filter(e => e.campus_id === c.id)
      return {
        ...c,
        total: doCampus.length,
        problemas: doCampus.filter(e => e.status === 'danificado' || e.status === 'em_manutencao').length,
        valor: doCampus.reduce((soma, e) => soma + Number(e.value ?? 0), 0),
        manutencoes: pendentes.filter(m => m.campus_id === c.id).length,
      }
    })
    .sort((a, b) => b.problemas - a.problemas || b.total - a.total || a.name.localeCompare(b.name))

  const maiorTotal = Math.max(1, ...porCampus.map(c => c.total))

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do inventário de mídia dos {campusList.length} campus</p>
      </div>

      {/* Indicadores */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Indicador titulo="Equipamentos em uso" valor={emUso.length} detalhe={`${formatarMoeda(valorTotal)} em patrimônio`} />
        <Indicador
          titulo="Com problema"
          valor={porStatus.find(s => s.status === 'danificado')!.total + porStatus.find(s => s.status === 'em_manutencao')!.total}
          detalhe="danificados ou em manutenção"
          destaque="text-yellow-700"
        />
        <Indicador titulo="Manutenções abertas" valor={pendentes.length} detalhe={`${criticas.length} de prioridade alta ou crítica`} />
        <Indicador
          titulo="Atrasadas"
          valor={atrasadas.length}
          detalhe={prontas.length ? `${prontas.length} pronta(s) para buscar` : 'passaram da data prevista'}
          destaque={atrasadas.length ? 'text-red-700' : 'text-gray-900'}
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Manutenções pendentes */}
        <section className="xl:col-span-2 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-lg">Manutenções em andamento</h2>
            <Link href="/manutencoes" className="text-sm text-indigo-600 hover:text-indigo-700">Ver todas →</Link>
          </div>
          {pendentes.length === 0 ? (
            <p className="p-5 text-gray-500">Nenhuma manutenção em andamento.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {pendentes.slice(0, 8).map(m => (
                <li key={m.id} className="p-5 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {m.equipment?.name ?? 'Equipamento'} <span className="text-gray-500 font-normal">· {m.campus?.name}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{m.problem_description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full font-medium ${PRIORIDADE_COLORS[m.priority]}`}>
                      {PRIORIDADE_LABELS[m.priority]}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{MANUTENCAO_STATUS_LABELS[m.status]}</span>
                    {m.atraso !== null && (
                      <span className={m.atraso > 0 ? 'text-red-700 font-medium' : 'text-gray-500'}>
                        {m.atraso > 0
                          ? `${m.atraso} dia(s) de atraso`
                          : m.atraso === 0
                            ? 'previsto para hoje'
                            : `previsto em ${-m.atraso} dia(s)`}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Situação dos equipamentos */}
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-lg mb-4">Situação dos equipamentos</h2>
          <ul className="space-y-3">
            {porStatus.map(({ status, total }) => (
              <li key={status}>
                <Link href={`/equipamentos?status=${status}`} className="flex items-center justify-between hover:bg-gray-50 rounded-lg -mx-2 px-2 py-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                  <span className="font-semibold">{total}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Por campus */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <h2 className="font-semibold text-lg p-5 border-b border-gray-100">Por campus</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-5 py-3 font-semibold">Campus</th>
              <th className="px-5 py-3 font-semibold">Equipamentos</th>
              <th className="px-5 py-3 font-semibold">Com problema</th>
              <th className="px-5 py-3 font-semibold">Manutenções abertas</th>
              <th className="px-5 py-3 font-semibold text-right">Patrimônio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {porCampus.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <Link href={`/equipamentos?campus=${c.id}`} className="font-medium text-gray-900 hover:text-indigo-700">{c.name}</Link>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-right">{c.total}</span>
                    <div className="flex-1 max-w-[160px] h-2 bg-gray-100 rounded-full">
                      <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${(c.total / maiorTotal) * 100}%` }} />
                    </div>
                  </div>
                </td>
                <td className={`px-5 py-3 ${c.problemas ? 'text-yellow-700 font-medium' : 'text-gray-400'}`}>{c.problemas}</td>
                <td className={`px-5 py-3 ${c.manutencoes ? 'font-medium' : 'text-gray-400'}`}>{c.manutencoes}</td>
                <td className="px-5 py-3 text-right whitespace-nowrap">{formatarMoeda(c.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {porCampus.every(c => c.total === 0) && (
          <p className="p-5 text-gray-500">Nenhum equipamento cadastrado ainda.</p>
        )}
      </section>
    </div>
  )
}
