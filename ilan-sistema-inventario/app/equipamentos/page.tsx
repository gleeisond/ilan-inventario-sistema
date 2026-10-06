import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { STATUS_COLORS, STATUS_LABELS, formatarMoeda } from '@/lib/equipamentos'
import { EquipmentStatus } from '@/types/database'

export const dynamic = 'force-dynamic'

type Filtros = { campus?: string; status?: string; categoria?: string; busca?: string; criado?: string }

type EquipamentoLinha = {
  id: string
  name: string
  brand: string | null
  category: string | null
  value: number | null
  status: EquipmentStatus
  location: string | null
  campus: { name: string } | null
  responsible: { name: string } | null
}

export default async function Equipamentos({ searchParams }: { searchParams: Filtros }) {
  const supabase = getSupabase()

  let query = supabase
    .from('equipment')
    .select('id, name, brand, category, value, status, location, campus:campus_id (name), responsible:responsible_id (name)')
    .order('name')

  if (searchParams.campus) query = query.eq('campus_id', searchParams.campus)
  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.categoria) query = query.eq('category', searchParams.categoria)
  if (searchParams.busca) {
    const termo = searchParams.busca.replace(/[,()%]/g, ' ').trim()
    if (termo) query = query.or(`name.ilike.%${termo}%,brand.ilike.%${termo}%`)
  }

  const [{ data, error }, { data: campusList }, { data: categorias }] = await Promise.all([
    query,
    supabase.from('campus').select('id, name').order('name'),
    supabase.from('categories').select('name').order('name'),
  ])

  const equipamentos = (data ?? []) as unknown as EquipamentoLinha[]
  const valorTotal = equipamentos.reduce((soma, e) => soma + Number(e.value ?? 0), 0)
  const temFiltro = Boolean(searchParams.campus || searchParams.status || searchParams.categoria || searchParams.busca)

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Equipamentos</h1>
          <p className="text-gray-600 mt-1">
            {equipamentos.length} {equipamentos.length === 1 ? 'equipamento' : 'equipamentos'} · {formatarMoeda(valorTotal)}
          </p>
        </div>
        <Link
          href="/equipamentos/criar"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          + Novo equipamento
        </Link>
      </div>

      {searchParams.criado && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">
          Equipamento cadastrado.
        </div>
      )}

      {/* Filtros */}
      <form className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Buscar
          <input
            name="busca"
            defaultValue={searchParams.busca}
            placeholder="Nome ou marca"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </label>
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Campus
          <select name="campus" defaultValue={searchParams.campus ?? ''} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">Todos</option>
            {campusList?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Status
          <select name="status" defaultValue={searchParams.status ?? ''} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>{rotulo}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Categoria
          <select name="categoria" defaultValue={searchParams.categoria ?? ''} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">Todas</option>
            {categorias?.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition">
          Filtrar
        </button>
        {temFiltro && (
          <Link href="/equipamentos" className="text-sm text-indigo-600 hover:text-indigo-700 py-2">
            Limpar filtros
          </Link>
        )}
      </form>

      {error ? (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          Erro ao carregar equipamentos: {error.message}
        </div>
      ) : equipamentos.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          {temFiltro ? 'Nenhum equipamento encontrado com esses filtros.' : 'Nenhum equipamento cadastrado ainda.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Equipamento</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Campus</th>
                <th className="px-4 py-3 font-semibold">Local</th>
                <th className="px-4 py-3 font-semibold">Responsável</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipamentos.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{e.name}</div>
                    {e.brand && <div className="text-gray-500">{e.brand}</div>}
                  </td>
                  <td className="px-4 py-3 capitalize">{e.category ?? '—'}</td>
                  <td className="px-4 py-3">{e.campus?.name ?? '—'}</td>
                  <td className="px-4 py-3">{e.location ?? '—'}</td>
                  <td className="px-4 py-3">{e.responsible?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block whitespace-nowrap px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[e.status]}`}>
                      {STATUS_LABELS[e.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{formatarMoeda(e.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
