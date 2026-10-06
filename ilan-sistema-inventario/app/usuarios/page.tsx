import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { PERFIS, PERFIL_COLORS, PERFIL_DESCRICOES, PERFIL_LABELS } from '@/lib/usuarios'
import { UserRole } from '@/types/database'
import { emailParaLogin, exigirAdmin, idsComAcesso } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type Filtros = { perfil?: string; campus?: string; situacao?: string; busca?: string; salvo?: string }

type UsuarioLinha = {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  campus: { name: string } | null
  region: { name: string } | null
}

const selectClass = 'px-3 py-2 border border-gray-300 rounded-lg'

export default async function Usuarios({ searchParams }: { searchParams: Filtros }) {
  await exigirAdmin()
  const supabase = getSupabase()
  const situacao = searchParams.situacao ?? 'ativos'

  let query = supabase
    .from('users')
    .select('id, name, email, role, is_active, campus:campus_id (name), region:region_id (name)')
    .order('name')
  if (searchParams.perfil) query = query.eq('role', searchParams.perfil)
  if (searchParams.campus) query = query.eq('campus_id', searchParams.campus)
  if (situacao !== 'todos') query = query.eq('is_active', situacao === 'ativos')
  if (searchParams.busca) {
    const termo = searchParams.busca.replace(/[,()%]/g, ' ').trim()
    if (termo) query = query.or(`name.ilike.%${termo}%,email.ilike.%${termo}%`)
  }

  const [{ data, error }, { data: campusList }, { data: todos }, comAcesso] = await Promise.all([
    query,
    supabase.from('campus').select('id, name').order('name'),
    supabase.from('users').select('role').eq('is_active', true),
    idsComAcesso(),
  ])

  const usuarios = (data ?? []) as unknown as UsuarioLinha[]
  const porPerfil = PERFIS.map(perfil => ({ perfil, total: (todos ?? []).filter(u => u.role === perfil).length }))
  const temFiltro = situacao !== 'ativos' || Boolean(searchParams.perfil || searchParams.campus || searchParams.busca)

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuários e perfis</h1>
          <p className="text-gray-600 mt-1">
            {usuarios.length} {usuarios.length === 1 ? 'usuário' : 'usuários'}
          </p>
        </div>
        <Link
          href="/usuarios/novo"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          + Novo usuário
        </Link>
      </div>

      {searchParams.salvo && (
        <div className="p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">
          Usuário {searchParams.salvo} salvo.
        </div>
      )}

      {/* Perfis: clicar filtra a lista */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {porPerfil.map(({ perfil, total }) => (
          <Link
            key={perfil}
            href={searchParams.perfil === perfil ? '/usuarios' : `/usuarios?perfil=${perfil}`}
            className={`bg-white rounded-lg border p-4 hover:border-indigo-300 ${
              searchParams.perfil === perfil ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${PERFIL_COLORS[perfil]}`}>{PERFIL_LABELS[perfil]}</span>
              <span className="text-xl font-bold">{total}</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">{PERFIL_DESCRICOES[perfil]}</p>
          </Link>
        ))}
      </section>

      <form className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Buscar
          <input name="busca" defaultValue={searchParams.busca} placeholder="Nome ou usuário" className={selectClass} />
        </label>
        <label className="flex flex-col text-sm text-gray-700 gap-1">
          Perfil
          <select name="perfil" defaultValue={searchParams.perfil ?? ''} className={selectClass}>
            <option value="">Todos</option>
            {PERFIS.map(p => (
              <option key={p} value={p}>{PERFIL_LABELS[p]}</option>
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
          Situação
          <select name="situacao" defaultValue={situacao} className={selectClass}>
            <option value="ativos">Acesso liberado</option>
            <option value="inativos">Bloqueados</option>
            <option value="todos">Todos</option>
          </select>
        </label>
        <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition">
          Filtrar
        </button>
        {temFiltro && (
          <Link href="/usuarios" className="text-sm text-indigo-600 hover:text-indigo-700 py-2">
            Limpar filtros
          </Link>
        )}
      </form>

      {error ? (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          Erro ao carregar usuários: {error.message}
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Perfil</th>
                <th className="px-4 py-3 font-semibold">Campus / região</th>
                <th className="px-4 py-3 font-semibold">Acesso</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 ${u.is_active ? '' : 'text-gray-400'}`}>
                  <td className="px-4 py-3">
                    <div className={`font-medium ${u.is_active ? 'text-gray-900' : ''}`}>{u.name}</div>
                    <div className="text-gray-500">{emailParaLogin(u.email)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block whitespace-nowrap px-2 py-1 rounded-full text-xs font-medium ${PERFIL_COLORS[u.role]}`}>
                      {PERFIL_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u.campus?.name ?? (u.region ? `Região ${u.region.name}` : '—')}</td>
                  <td className="px-4 py-3">
                    {!u.is_active ? (
                      <span className="text-red-700">Bloqueado</span>
                    ) : comAcesso && !comAcesso.has(u.id) ? (
                      <span className="text-yellow-700">Sem senha</span>
                    ) : (
                      'Liberado'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/usuarios/${u.id}`} className="text-indigo-600 hover:text-indigo-700">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
