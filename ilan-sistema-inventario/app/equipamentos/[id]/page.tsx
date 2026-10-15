'use client'
// app/equipamentos/[id]/page.tsx
// Ficha do equipamento: dados, ações, histórico e manutenções.
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useProfile } from '@/lib/profile'
import {
  deleteEquipment,
  getEquipment,
  getHistory,
  getMaintenance,
  listCampuses,
  listPeople,
  updateEquipment,
  type Person,
} from '@/lib/equipamentos/repo'
import { canDeleteEquipment, canEditEquipment } from '@/lib/equipamentos/permissions'
import { describeHistory } from '@/lib/equipamentos/history'
import { MAINTENANCE_STATUS_LABEL, PRIORITY_LABEL, STATUS_LABEL, STATUS_ORDER } from '@/lib/equipamentos/labels'
import { formatAge, formatBRL, formatDate, formatDateTime } from '@/lib/format'
import type {
  Campus,
  EquipmentHistoryWithUser,
  EquipmentMaintenanceSummary,
  EquipmentStatus,
  EquipmentWithRelations,
} from '@/types/database'
import StatusBadge from '@/components/equipamentos/StatusBadge'
import ErrorBox from '@/components/equipamentos/ErrorBox'

const SAVED_MESSAGE: Record<string, string> = {
  cadastrado: 'Equipamento cadastrado.',
  editado: 'Alterações salvas.',
}

type Confirming = null | 'baixa' | 'excluir'

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-cinza">{label}</dt>
      <dd className="text-sm text-tinta">{children}</dd>
    </div>
  )
}

export default function EquipamentoPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const profile = useProfile()

  const [equipment, setEquipment] = useState<EquipmentWithRelations | null | undefined>(undefined)
  const [history, setHistory] = useState<EquipmentHistoryWithUser[]>([])
  const [maintenance, setMaintenance] = useState<EquipmentMaintenanceSummary[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(SAVED_MESSAGE[searchParams.get('salvo') ?? ''] ?? null)
  const [newStatus, setNewStatus] = useState<EquipmentStatus | ''>('')
  const [confirming, setConfirming] = useState<Confirming>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [eq, hist, maint, campusList, personList] = await Promise.all([
        getEquipment(id),
        getHistory(id),
        getMaintenance(id),
        listCampuses(),
        listPeople(),
      ])
      setEquipment(eq)
      setHistory(hist)
      setMaintenance(maint)
      setCampuses(campusList)
      setPeople(personList)
      if (eq) setNewStatus(eq.status)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o equipamento.')
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function changeStatus(status: EquipmentStatus, message: string) {
    setBusy(true)
    setActionError(null)
    try {
      await updateEquipment(id, { status }, profile.id)
      setConfirming(null)
      setNotice(message)
      await load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Não foi possível alterar o status.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    setActionError(null)
    try {
      await deleteEquipment(id)
      router.push('/equipamentos')
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Não foi possível excluir.')
      setBusy(false)
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <ErrorBox message={error} onRetry={load} />
      </div>
    )
  }
  if (equipment === undefined) {
    return <div className="mx-auto h-96 max-w-4xl animate-pulse rounded-lg bg-white/70" aria-label="Carregando equipamento" />
  }
  if (equipment === null) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <ErrorBox message="Equipamento não encontrado. Ele pode ter sido excluído ou você não tem acesso a ele." />
        <Link href="/equipamentos" className="text-sm font-semibold text-tinta underline">
          Voltar para a lista
        </Link>
      </div>
    )
  }

  const canEdit = canEditEquipment(profile, equipment, campuses)
  const canDelete = canDeleteEquipment(profile)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <Link href="/equipamentos" className="text-sm text-cinza hover:text-tinta">
          ← Equipamentos
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold tracking-tight text-tinta">{equipment.name}</h1>
            <p className="mt-1 text-sm text-cinza">
              {[equipment.brand, equipment.category, equipment.campus?.name].filter(Boolean).join(' · ') || 'Sem marca ou categoria'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={equipment.status} />
            {canEdit && (
              <Link
                href={`/equipamentos/${equipment.id}/editar`}
                className="rounded-md border border-tinta px-4 py-2 text-sm font-semibold text-tinta transition hover:bg-tinta hover:text-nevoa"
              >
                Editar
              </Link>
            )}
          </div>
        </div>
      </div>

      {notice && (
        <div role="status" className="flex items-center justify-between rounded-lg border border-[#BFDCCB] bg-[#E9F4EE] px-4 py-3 text-sm text-[#1F5A40]">
          {notice}
          <button type="button" onClick={() => setNotice(null)} className="text-xs underline">
            Fechar
          </button>
        </div>
      )}

      <section className="rounded-lg border border-linha bg-white p-5 md:p-6">
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Campus">{equipment.campus?.name ?? '—'}</Info>
          <Info label="Local">{equipment.location ?? '—'}</Info>
          <Info label="Responsável">{equipment.responsible?.name ?? 'Sem responsável'}</Info>
          <Info label="Valor de compra">
            <span className="num">{formatBRL(equipment.value)}</span>
          </Info>
          <Info label="Data de compra">{formatDate(equipment.purchase_date)}</Info>
          <Info label="Tempo de uso">{formatAge(equipment.purchase_date)}</Info>
          <Info label="Cadastrado em">{formatDateTime(equipment.created_at)}</Info>
          <Info label="Última alteração">{formatDateTime(equipment.updated_at)}</Info>
        </dl>
        {equipment.notes && (
          <div className="mt-5 border-t border-linha pt-4">
            <Info label="Observações">
              <span className="whitespace-pre-line">{equipment.notes}</span>
            </Info>
          </div>
        )}
      </section>

      {canEdit && (
        <section className="flex flex-col gap-4 rounded-lg border border-linha bg-white p-5 md:p-6">
          <h2 className="font-display text-base font-bold text-tinta">Situação do equipamento</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-tinta">
              Status
              <select
                id="novo-status"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as EquipmentStatus)}
                className="rounded-md border border-linha bg-white px-3 py-2 text-sm outline-none focus:border-tinta focus:ring-2 focus:ring-ouro/40"
              >
                {STATUS_ORDER.map(s => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={busy || newStatus === equipment.status || !newStatus}
              onClick={() => newStatus && changeStatus(newStatus, `Status alterado para ${STATUS_LABEL[newStatus]}.`)}
              className="rounded-md bg-grafite px-4 py-2 text-sm font-semibold text-nevoa disabled:opacity-40"
            >
              Salvar status
            </button>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-linha pt-4 text-sm">
            {equipment.status !== 'descartado' && confirming !== 'baixa' && (
              <button type="button" onClick={() => setConfirming('baixa')} className="font-semibold text-tinta underline">
                Dar baixa
              </button>
            )}
            {canDelete && confirming !== 'excluir' && (
              <button type="button" onClick={() => setConfirming('excluir')} className="font-semibold text-[#8A2E1C] underline">
                Excluir
              </button>
            )}
          </div>

          {confirming === 'baixa' && (
            <div className="rounded-md border border-linha bg-papel p-4 text-sm">
              <p className="text-tinta">
                Dar baixa tira o equipamento do patrimônio em uso e do valor total. O cadastro e o histórico continuam guardados.
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => changeStatus('descartado', 'Baixa registrada.')}
                  className="rounded-md bg-grafite px-4 py-2 font-semibold text-nevoa disabled:opacity-60"
                >
                  Confirmar baixa
                </button>
                <button type="button" onClick={() => setConfirming(null)} className="px-2 text-cinza">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {confirming === 'excluir' && (
            <div className="rounded-md border border-[#E9C3B8] bg-[#FBEDE9] p-4 text-sm text-[#5E1F12]">
              <p>
                Excluir apaga o equipamento, o histórico e as manutenções ligadas a ele, sem volta. Para tirar de uso e manter o
                registro, prefira dar baixa.
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={remove}
                  className="rounded-md bg-[#8A2E1C] px-4 py-2 font-semibold text-white disabled:opacity-60"
                >
                  Excluir de vez
                </button>
                <button type="button" onClick={() => setConfirming(null)} className="px-2">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {actionError && <ErrorBox message={actionError} />}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-linha bg-white p-5 md:p-6">
          <h2 className="font-display text-base font-bold text-tinta">Histórico</h2>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-cinza">Nenhuma alteração registrada.</p>
          ) : (
            <ol className="mt-4 flex flex-col">
              {history.map(entry => {
                const { title, details } = describeHistory(entry, campuses, people)
                return (
                  <li key={entry.id} className="relative border-l border-linha pb-5 pl-5 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-[2px] bg-ouro" aria-hidden="true" />
                    <p className="text-sm font-semibold text-tinta">{title}</p>
                    {details.map(d => (
                      <p key={d} className="text-sm text-cinza">
                        {d}
                      </p>
                    ))}
                    <p className="mt-0.5 text-xs text-cinza">
                      {formatDateTime(entry.created_at)}
                      {entry.changed_by?.name ? ` · ${entry.changed_by.name}` : ''}
                    </p>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        <section className="rounded-lg border border-linha bg-white p-5 md:p-6">
          <h2 className="font-display text-base font-bold text-tinta">Manutenções</h2>
          {maintenance.length === 0 ? (
            <p className="mt-3 text-sm text-cinza">Nenhuma manutenção registrada para este equipamento.</p>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-linha">
              {maintenance.map(m => (
                <li key={m.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <p className="text-sm text-tinta">{m.problem_description}</p>
                  <p className="text-xs text-cinza">
                    {formatDate(m.created_at)} · {MAINTENANCE_STATUS_LABEL[m.status]} · prioridade {PRIORITY_LABEL[m.priority].toLowerCase()}
                    {m.cost != null && (
                      <>
                        {' · '}
                        <span className="num">{formatBRL(m.cost)}</span>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
