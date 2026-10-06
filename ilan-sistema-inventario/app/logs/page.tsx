import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { AcaoLog, exigirAdmin } from '@/lib/auth'
import { ACAO_LOG_COLORS, ACAO_LOG_LABELS, LINK_ENTIDADE } from '@/lib/logs'

export const dynamic = 'force-dynamic'

const LIMITE = 200

type Filtros = { usuario?: string; acao?: string; de?: string; ate?: string; busca?: string }

type LinhaLog = {
  id: string
  user_name: string
  action: AcaoLog
  entity: string | null
  entity_id: string | null
  description: string
  created_at: string
}

const campoClass = 'px-3 py-2 border border-gray-300 rounded-lg'

// created_at é gravado em UTC sem fuso; mostramos no horário de Brasília
function formatarDataHora(data: string) {
  return new Date(data.endsWith('Z') ? data : data + 'Z').toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  })
}

export default async function Logs({ searchParams }: { searchParams: Filtros }) {
  await exigirAdmin()
  const supabase = getSupabase()

  let query = supabase
    .from('activity_logs')
    .select('id, user_name, action, entity, entity_id, description, created_at')
    .order('created_at', { ascending: false })
    .limit(LIMITE)
  if (searchParams.usuario) query = query.eq('user_id', searchParams.usuario)
  if (searchParams.acao) query = query.eq('action', searchParams.acao)
  // Datas do filtro são dias em Brasília (UTC-3)
  if (searchParams.de) query = query.gte('created_at', `${searchParams.de}T03:00:00`)
  if (searchParams.ate) {
    const fim = new Date(`${searchParams.ate}T03:00:00Z`)
    fim.setUTCDate(fim.getUTCDate() + 1)
    query = query.lt('created_at', fim.toISOString().slice(0, 19))
  }
  if (searchParams.busca) {
    const termo = searchParams.busca.replace(/[,()%]/g, ' ').trim()
    if (termo) query = query.or(`description.ilike.%${termo}%,user_name.ilike.%${termo}%`)
  }

  const [{ data, error }, { data: usuarios }] = await Promise.all([
    query,
    supabase.from('users').select('id, name').order('name'),
  ])
  const logs = (data ?? []) as LinhaLog[]
  const temFiltro = Object.values(searchParams).some(Boolean)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Logs de atividade</h1>
        <p className="text-gray-600 mt-1">O que cada usuário fez no sistema, do mais recente para o mais antigo.</p>
      </div>

      <form className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Buscar
          <input name="busca" defaultValue={searchParams.busca} placeholder="Texto do registro" className={campoClass} />
        </label>
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Usuário
          <select name="usuario" defaultValue={searchParams.usuario ?? ''} className={campoClass}>
            <option value="">Todos</option>
            {usuarios?.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Ação
          <select name="acao" defaultValue={searchParams.acao ?? ''} className={campoClass}>
            <option value="">Todas</option>
            {Object.entries(ACAO_LOG_LABELS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>{rotulo}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          De
          <input name="de" type="date" defaultValue={searchParams.de} className={campoClass} />
        </label>
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Até
          <input name="ate" type="date" defaultValue={searchParams.ate} className={campoClass} />
        </label>
        <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition">
          Filtrar
        </button>
        {temFiltro && (
          <Link href="/logs" className="text-sm text-indigo-600 hover:text-indigo-700 py-2">
            Limpar filtros
          </Link>
        )}
      </form>

      {error ? (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          Erro ao carregar os logs: {error.message}
          {error.message.includes('activity_logs') && ' (a tabela activity_logs ainda não foi criada no Supabase)'}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          {temFiltro ? 'Nenhum registro com esses filtros.' : 'Nenhuma atividade registrada ainda.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Quando</th>
                <th className="px-4 py-3 font-semibold">Usuário</th>
                <th className="px-4 py-3 font-semibold">Ação</th>
                <th className="px-4 py-3 font-semibold">O que fez</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(l => {
                const link = l.entity && l.entity_id ? LINK_ENTIDADE[l.entity]?.(l.entity_id) : null
                return (
                  <tr key={l.id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatarDataHora(l.created_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">{l.user_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block whitespace-nowrap px-2 py-1 rounded-full text-xs font-medium ${ACAO_LOG_COLORS[l.action] ?? 'bg-gray-100 text-gray-700'}`}>
                        {ACAO_LOG_LABELS[l.action] ?? l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {link ? (
                        <Link href={link} className="hover:text-indigo-700">{l.description}</Link>
                      ) : (
                        l.description
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {logs.length === LIMITE && (
            <p className="p-4 text-xs text-gray-500">Mostrando os {LIMITE} registros mais recentes. Use os filtros para ver mais antigos.</p>
          )}
        </div>
      )}
    </div>
  )
}
