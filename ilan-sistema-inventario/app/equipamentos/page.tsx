'use client'
// app/equipamentos/page.tsx
// Lista de equipamentos com resumo, busca e filtros.
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/profile'
import { listCampuses, listEquipment } from '@/lib/equipamentos/repo'
import { canCreateEquipment } from '@/lib/equipamentos/permissions'
import { CATEGORIES, STATUS_LABEL } from '@/lib/equipamentos/labels'
import { formatBRL } from '@/lib/format'
import type { Campus, EquipmentStatus, EquipmentWithRelations } from '@/types/database'
import StatusBadge from '@/components/equipamentos/StatusBadge'
import ErrorBox from '@/components/equipamentos/ErrorBox'

// 'em_uso' = tudo menos os baixados, que é o que a pessoa quer ver no dia a dia.
type StatusFilter = 'em_uso' | 'todos' | EquipmentStatus

const inputClass =
  'w-full rounded-md border border-linha bg-white px-3 py-2 text-sm text-tinta outline-none transition focus:border-tinta focus:ring-2 focus:ring-ouro/40'

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export default function EquipamentosPage() {
  const profile = useProfile()
  const router = useRouter()
  const [items, setItems] = useState<EquipmentWithRelations[] | null>(null)
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('em_uso')
  const [campusId, setCampusId] = useState('')
  const [category, setCategory] = useState('')

  const load = useCallback(async () => {
    setError(null)
    try {
      const [equipment, campusList] = await Promise.all([listEquipment(), listCampuses()])
      setItems(equipment)
      setCampuses(campusList)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar os equipamentos.')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Só mostra o filtro de campus para quem enxerga mais de um.
  const visibleCampuses = useMemo(() => {
    const ids = new Set((items ?? []).map(e => e.campus_id))
    return campuses.filter(c => ids.has(c.id))
  }, [items, campuses])

  const categories = useMemo(() => {
    const used = new Set((items ?? []).map(e => e.category).filter(Boolean) as string[])
    return [...CATEGORIES.filter(c => used.has(c)), ...[...used].filter(c => !CATEGORIES.includes(c)).sort()]
  }, [items])

  const filtered = useMemo(() => {
    const term = normalize(search.trim())
    return (items ?? []).filter(e => {
      if (status === 'em_uso' && e.status === 'descartado') return false
      if (status !== 'em_uso' && status !== 'todos' && e.status !== status) return false
      if (campusId && e.campus_id !== campusId) return false
      if (category && e.category !== category) return false
      if (term) {
        const haystack = normalize([e.name, e.brand, e.location, e.category, e.campus?.name].filter(Boolean).join(' '))
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [items, search, status, campusId, category])

  const summary = useMemo(() => {
    const inUse = filtered.filter(e => e.status !== 'descartado')
    return {
      count: inUse.length,
      value: inUse.reduce((sum, e) => sum + (e.value ?? 0), 0),
      maintenance: filtered.filter(e => e.status === 'em_manutencao').length,
      damaged: filtered.filter(e => e.status === 'danificado').length,
    }
  }, [filtered])

  const hasFilters = search !== '' || status !== 'em_uso' || campusId !== '' || category !== ''
  const clearFilters = () => {
    setSearch('')
    setStatus('em_uso')
    setCampusId('')
    setCategory('')
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-ouro-escuro">Patrimônio</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-tinta">Equipamentos</h1>
        </div>
        {canCreateEquipment(profile) && (
          <Link
            href="/equipamentos/criar"
            className="rounded-md bg-grafite px-4 py-2.5 text-sm font-semibold text-nevoa transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-ouro"
          >
            Cadastrar equipamento
          </Link>
        )}
      </div>

      {error && <ErrorBox message={error} onRetry={load} />}

      <section aria-label="Resumo" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Bens em uso', value: items ? String(summary.count) : '…' },
          { label: 'Valor de compra', value: items ? formatBRL(summary.value) : '…' },
          { label: 'Em manutenção', value: items ? String(summary.maintenance) : '…' },
          { label: 'Danificados', value: items ? String(summary.damaged) : '…' },
        ].map(card => (
          <div key={card.label} className="rounded-lg border border-linha bg-white p-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-cinza">{card.label}</p>
            <p className="num mt-1 truncate text-lg font-semibold text-tinta md:text-xl">{card.value}</p>
          </div>
        ))}
      </section>

      <section aria-label="Filtros" className="grid gap-3 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <label className="flex flex-col gap-1 text-xs font-medium text-cinza">
          Buscar
          <input
            id="busca"
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nome, marca, local ou campus"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-cinza">
          Status
          <select id="filtro-status" value={status} onChange={e => setStatus(e.target.value as StatusFilter)} className={inputClass}>
            <option value="em_uso">Em uso</option>
            <option value="ativo">{STATUS_LABEL.ativo}</option>
            <option value="em_manutencao">{STATUS_LABEL.em_manutencao}</option>
            <option value="danificado">{STATUS_LABEL.danificado}</option>
            <option value="descartado">{STATUS_LABEL.descartado}</option>
            <option value="todos">Todos</option>
          </select>
        </label>
        {visibleCampuses.length > 1 ? (
          <label className="flex flex-col gap-1 text-xs font-medium text-cinza">
            Campus
            <select id="filtro-campus" value={campusId} onChange={e => setCampusId(e.target.value)} className={inputClass}>
              <option value="">Todos os campus</option>
              {visibleCampuses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="hidden md:block" />
        )}
        <label className="flex flex-col gap-1 text-xs font-medium text-cinza">
          Categoria
          <select id="filtro-categoria" value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
            <option value="">Todas</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </section>

      {items === null && !error && (
        <div className="flex flex-col gap-2" aria-label="Carregando equipamentos">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/70" />
          ))}
        </div>
      )}

      {items !== null && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-linha bg-white p-10 text-center">
          <h2 className="font-display text-lg font-bold text-tinta">Nenhum equipamento cadastrado ainda</h2>
          <p className="mt-2 text-sm text-cinza">Cadastre o primeiro bem para começar o inventário do campus.</p>
          {canCreateEquipment(profile) && (
            <Link href="/equipamentos/criar" className="mt-4 inline-block rounded-md bg-grafite px-4 py-2 text-sm font-semibold text-nevoa">
              Cadastrar equipamento
            </Link>
          )}
        </div>
      )}

      {items !== null && items.length > 0 && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-linha bg-white p-8 text-center text-sm text-cinza">
          Nenhum equipamento encontrado com esses filtros.{' '}
          <button type="button" onClick={clearFilters} className="font-semibold text-tinta underline">
            Limpar filtros
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          <p className="-mb-3 text-xs text-cinza">
            {filtered.length} {filtered.length === 1 ? 'equipamento' : 'equipamentos'}
            {hasFilters && (
              <>
                {' · '}
                <button type="button" onClick={clearFilters} className="underline">
                  limpar filtros
                </button>
              </>
            )}
          </p>

          {/* Tabela a partir do tablet */}
          <div className="hidden overflow-x-auto rounded-lg border border-linha bg-white md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-linha text-xs uppercase tracking-wider text-cinza">
                <tr>
                  <th className="px-4 py-3 font-medium">Equipamento</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Campus</th>
                  <th className="px-4 py-3 font-medium">Local</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Valor de compra</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr
                    key={e.id}
                    onClick={() => router.push(`/equipamentos/${e.id}`)}
                    className="cursor-pointer border-b border-[#EDECE7] last:border-0 hover:bg-papel/60"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/equipamentos/${e.id}`} onClick={ev => ev.stopPropagation()} className="font-semibold text-tinta hover:underline">
                        {e.name}
                      </Link>
                      {e.brand && <p className="text-xs text-cinza">{e.brand}</p>}
                    </td>
                    <td className="px-4 py-3 text-cinza">{e.category ?? '—'}</td>
                    <td className="px-4 py-3 text-cinza">{e.campus?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-cinza">{e.location ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="num px-4 py-3 text-right">{formatBRL(e.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartões no celular */}
          <ul className="flex flex-col gap-2 md:hidden">
            {filtered.map(e => (
              <li key={e.id}>
                <Link href={`/equipamentos/${e.id}`} className="flex flex-col gap-2 rounded-lg border border-linha bg-white p-4">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block font-semibold text-tinta">{e.name}</span>
                      <span className="block text-xs text-cinza">
                        {[e.brand, e.campus?.name].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </span>
                    <StatusBadge status={e.status} />
                  </span>
                  <span className="flex items-center justify-between text-xs text-cinza">
                    <span>{e.location ?? 'Sem local definido'}</span>
                    <span className="num text-sm text-tinta">{formatBRL(e.value)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
