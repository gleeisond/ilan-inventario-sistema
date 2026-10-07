import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { formatarMoeda } from '@/lib/equipamentos'
import {
  ACAO_LABELS,
  MANUTENCAO_STATUS_COLORS,
  MANUTENCAO_STATUS_LABELS,
  PRIORIDADE_COLORS,
  PRIORIDADE_LABELS,
  STATUS_FINALIZADOS,
  descreverPrazo,
  diasDeAtraso,
  formatarData,
} from '@/lib/manutencoes'
import { ActionType, MaintenanceStatus, PriorityLevel } from '@/types/database'
import { getUsuarioAtual, exigirLogin } from '@/lib/auth'
import { atualizarManutencao, avancarEtapa } from '../actions'
import { ETAPAS, acoesDisponiveis, etapaAtual, podeAgir, responsavelPor } from '@/lib/fluxoReparo'
import { PERFIL_LABELS } from '@/lib/usuarios'
import EtapaReparo from '@/components/EtapaReparo'

export const dynamic = 'force-dynamic'

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none'

type Chamado = {
  id: string
  equipment_id: string
  problem_description: string
  status: MaintenanceStatus
  priority: PriorityLevel
  scheduled_completion_date: string | null
  actual_completion_date: string | null
  cost: number | null
  notes: string | null
  assigned_to_id: string | null
  created_at: string
  updated_at: string
  equipment: { name: string; brand: string | null } | null
  campus_id: string
  campus: { name: string; region_id: string } | null
  created_by: { name: string } | null
}

type Registro = {
  id: string
  action_type: ActionType
  description: string | null
  created_at: string
  performed_by: { name: string } | null
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      <span className="block mb-1">{label}</span>
      {children}
    </label>
  )
}

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })
}

export default async function DetalheManutencao({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { erro?: string; salvo?: string }
}) {
  await exigirLogin()
  const supabase = getSupabase()
  const [{ data, error }, { data: logsData }, { data: usuarios }] = await Promise.all([
    supabase
      .from('maintenance_requests')
      .select(
        'id, equipment_id, problem_description, status, priority, scheduled_completion_date, actual_completion_date, cost, notes, assigned_to_id, created_at, updated_at, campus_id, equipment:equipment_id (name, brand), campus:campus_id (name, region_id), created_by:created_by_id (name)'
      )
      .eq('id', params.id)
      .maybeSingle(),
    supabase
      .from('maintenance_logs')
      .select('id, action_type, description, created_at, performed_by:performed_by_id (name)')
      .eq('maintenance_request_id', params.id)
      .order('created_at', { ascending: false }),
    supabase.from('users').select('id, name').eq('is_active', true).order('name'),
  ])

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="aviso aviso-erro p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          Erro ao carregar o chamado: {error.message}
        </div>
      </div>
    )
  }
  if (!data) notFound()

  const usuarioLogado = await getUsuarioAtual()
  const m = data as unknown as Chamado
  const registros = (logsData ?? []) as unknown as Registro[]
  const atraso = STATUS_FINALIZADOS.includes(m.status) ? null : diasDeAtraso(m.scheduled_completion_date)
  const etapa = etapaAtual(m.status)
  const responsavel = responsavelPor(m.status)
  const acoes = acoesDisponiveis(m.status)
  const minhaVez = podeAgir(usuarioLogado, { status: m.status, campus_id: m.campus_id, campus_region_id: m.campus?.region_id ?? null })
  const corrigeStatus = !usuarioLogado || usuarioLogado.role === 'admin'
  const editaCusto = !usuarioLogado || usuarioLogado.role === 'admin' || usuarioLogado.role === 'rodrigo'

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <Link href="/manutencoes" className="text-sm text-indigo-600 hover:text-indigo-700">
        ← Voltar para manutenções
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{m.equipment?.name ?? 'Equipamento'}</h1>
          <p className="text-gray-600 mt-1">
            {[m.equipment?.brand, m.campus?.name].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className={`px-3 py-1 rounded-full font-medium ${PRIORIDADE_COLORS[m.priority]}`}>
            Prioridade {PRIORIDADE_LABELS[m.priority].toLowerCase()}
          </span>
          <span className={`px-3 py-1 rounded-full font-medium ${MANUTENCAO_STATUS_COLORS[m.status]}`}>
            {MANUTENCAO_STATUS_LABELS[m.status]}
          </span>
        </div>
      </div>

      {searchParams.salvo && (
        <div className="mb-4 aviso aviso-ok p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">Chamado atualizado.</div>
      )}
      {searchParams.erro && (
        <div className="mb-4 aviso aviso-erro p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{searchParams.erro}</div>
      )}

      <section className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 mb-6">
        <h2 className="font-semibold mb-4">Fluxo do reparo</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-7 gap-3 sm:gap-2">
          {ETAPAS.map((e, i) => {
            const situacao = etapa === null ? 'encerrada' : i < etapa ? 'feita' : i === etapa ? 'atual' : 'pendente'
            return (
              <li key={e.titulo} className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                <span
                  className={`shrink-0 w-7 h-7 rounded-full grid place-items-center text-xs font-bold ${
                    situacao === 'feita'
                      ? 'bg-green-600 text-white'
                      : situacao === 'atual'
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                  aria-label={situacao === 'feita' ? 'feita' : situacao === 'atual' ? 'etapa atual' : undefined}
                >
                  {situacao === 'feita' ? '✓' : i + 1}
                </span>
                <span className="text-sm leading-tight">
                  <span className={`block ${situacao === 'atual' ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{e.titulo}</span>
                  <span className="block text-xs text-gray-500">{PERFIL_LABELS[e.quem]}</span>
                </span>
              </li>
            )
          })}
        </ol>
        {etapa === null && (
          <p className="mt-4 text-sm text-gray-600">Chamado encerrado: {MANUTENCAO_STATUS_LABELS[m.status].toLowerCase()}.</p>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold mb-2">Problema</h2>
            <p className="text-gray-700 whitespace-pre-line">{m.problem_description}</p>
            <dl className="grid grid-cols-2 gap-4 mt-6 text-sm">
              <div>
                <dt className="text-gray-500">Aberto em</dt>
                <dd>{formatarDataHora(m.created_at)}{m.created_by && ` por ${m.created_by.name}`}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Previsão</dt>
                <dd>
                  {formatarData(m.scheduled_completion_date)}
                  {atraso !== null && (
                    <span className={`ml-2 ${atraso > 0 ? 'text-red-700 font-medium' : 'text-gray-500'}`}>({descreverPrazo(atraso)})</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Concluído em</dt>
                <dd>{formatarData(m.actual_completion_date)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{m.status === 'aguardando_aprovacao' ? 'Orçamento aguardando aprovação' : 'Custo'}</dt>
                <dd>{formatarMoeda(m.cost)}</dd>
              </div>
            </dl>
          </section>

          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Histórico</h2>
            {registros.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma movimentação registrada ainda.</p>
            ) : (
              <ol className="space-y-4">
                {registros.map(r => (
                  <li key={r.id} className="border-l-2 border-indigo-200 pl-4">
                    <p className="font-medium text-gray-900">{ACAO_LABELS[r.action_type]}</p>
                    {r.description && <p className="text-sm text-gray-700">{r.description}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatarDataHora(r.created_at)}{r.performed_by && ` · ${r.performed_by.name}`}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6 order-first lg:order-none">
          {responsavel && (
            <section className={`rounded-lg border p-6 ${minhaVez ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}>
              <h2 className="font-semibold">Próxima etapa</h2>
              <p className="text-sm text-gray-600 mt-1 mb-4">
                {minhaVez && usuarioLogado?.role === responsavel
                  ? 'É a sua vez.'
                  : `Aguardando ${PERFIL_LABELS[responsavel].toLowerCase()}${responsavel === 'pastor' || responsavel === 'lider_midia' ? ` de ${m.campus?.name ?? 'campus'}` : ''}.`}
              </p>
              {minhaVez ? (
                <EtapaReparo
                  key={m.updated_at}
                  chamadoId={m.id}
                  status={m.status}
                  acoes={acoes}
                  pessoas={usuarioLogado ? null : usuarios ?? []}
                  custoAtual={m.cost === null ? '' : String(m.cost).replace('.', ',')}
                  enviar={avancarEtapa}
                />
              ) : (
                <p className="text-sm text-gray-500">Você acompanha por aqui; quem age nessa etapa é outra pessoa.</p>
              )}
            </section>
          )}

          {/* key muda a cada gravação para o formulário voltar limpo (sem o comentário anterior) */}
          <form key={m.updated_at} action={atualizarManutencao} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 h-fit">
            <h2 className="font-semibold">Dados do chamado</h2>
            <input type="hidden" name="id" value={m.id} />

            {corrigeStatus && (
              <details className="rounded-lg border border-gray-200 p-3">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">Corrigir status à mão</summary>
                <div className="space-y-4 mt-3">
                  <Campo label="Status">
                    <select name="status" defaultValue={m.status} className={inputClass}>
                      {Object.entries(MANUTENCAO_STATUS_LABELS).map(([valor, rotulo]) => (
                        <option key={valor} value={valor}>{rotulo}</option>
                      ))}
                    </select>
                  </Campo>
                  {!usuarioLogado && (
                    <Campo label="Quem está registrando (obrigatório ao mudar o status)">
                      <select name="performed_by_id" defaultValue="" className={inputClass}>
                        <option value="">Selecione</option>
                        {usuarios?.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </Campo>
                  )}
                  <Campo label="Motivo da correção">
                    <input name="comentario" placeholder="Ex: etapa marcada por engano" className={inputClass} />
                  </Campo>
                </div>
              </details>
            )}

            <Campo label="Prioridade">
              <select name="priority" defaultValue={m.priority} className={inputClass}>
                {Object.entries(PRIORIDADE_LABELS).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>{rotulo}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Responsável pelo conserto">
              <select name="assigned_to_id" defaultValue={m.assigned_to_id ?? ''} className={inputClass}>
                <option value="">Ninguém ainda</option>
                {usuarios?.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Previsão de conclusão">
              <input name="scheduled_completion_date" type="date" defaultValue={m.scheduled_completion_date ?? ''} className={inputClass} />
            </Campo>
            {editaCusto && (
              <Campo label="Custo (R$)">
                <input
                  name="cost"
                  inputMode="decimal"
                  placeholder="Ex: 350,00"
                  defaultValue={m.cost === null ? '' : String(m.cost).replace('.', ',')}
                  className={inputClass}
                />
              </Campo>
            )}
            <Campo label="Observações">
              <textarea name="notes" rows={3} defaultValue={m.notes ?? ''} className={inputClass} />
            </Campo>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition">
              Salvar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
