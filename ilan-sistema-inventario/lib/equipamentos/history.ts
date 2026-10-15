// lib/equipamentos/history.ts
// Regras do histórico de um equipamento. No Supabase, quem grava é o gatilho do banco
// (sql/001_equipamentos_rls_historico.sql), com as mesmas regras; no modo demonstração, esta função.
import type { Campus, Equipment, EquipmentEventType, EquipmentHistoryWithUser, User } from '@/types/database'
import { formatBRL, formatDate } from '@/lib/format'
import { EVENT_LABEL, FIELD_LABEL, STATUS_LABEL } from './labels'

export interface HistoryEntryDraft {
  event_type: EquipmentEventType
  description: string
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
}

const EDIT_FIELDS = ['name', 'brand', 'category', 'value', 'purchase_date', 'location', 'notes'] as const

export function historyForUpdate(before: Equipment, after: Equipment): HistoryEntryDraft[] {
  const entries: HistoryEntryDraft[] = []

  if (before.status !== after.status) {
    let type: EquipmentEventType = 'status_alterado'
    if (after.status === 'danificado') type = 'danificado'
    else if (after.status === 'ativo' && (before.status === 'danificado' || before.status === 'em_manutencao')) type = 'consertado'
    entries.push({ event_type: type, description: 'Status alterado', old_value: { status: before.status }, new_value: { status: after.status } })
  }
  if (before.campus_id !== after.campus_id) {
    entries.push({ event_type: 'movido', description: 'Campus alterado', old_value: { campus_id: before.campus_id }, new_value: { campus_id: after.campus_id } })
  }
  if ((before.responsible_id ?? null) !== (after.responsible_id ?? null)) {
    entries.push({
      event_type: 'responsavel_alterado',
      description: 'Responsável alterado',
      old_value: { responsible_id: before.responsible_id ?? null },
      new_value: { responsible_id: after.responsible_id ?? null },
    })
  }

  const oldValues: Record<string, unknown> = {}
  const newValues: Record<string, unknown> = {}
  for (const field of EDIT_FIELDS) {
    const a = before[field] ?? null
    const b = after[field] ?? null
    if (a !== b) {
      oldValues[field] = a
      newValues[field] = b
    }
  }
  if (Object.keys(newValues).length) {
    entries.push({ event_type: 'editado', description: 'Dados editados', old_value: oldValues, new_value: newValues })
  }
  return entries
}

// Texto de cada linha do histórico, montado a partir dos valores antigo e novo.
export function describeHistory(
  entry: EquipmentHistoryWithUser,
  campuses: Pick<Campus, 'id' | 'name'>[],
  people: Pick<User, 'id' | 'name'>[],
): { title: string; details: string[] } {
  const title = EVENT_LABEL[entry.event_type] ?? entry.event_type
  const oldV = entry.old_value ?? {}
  const newV = entry.new_value ?? {}

  const show = (field: string, value: unknown): string => {
    if (value === null || value === undefined || value === '') return 'vazio'
    if (field === 'status') return STATUS_LABEL[value as Equipment['status']] ?? String(value)
    if (field === 'value') return formatBRL(Number(value))
    if (field === 'purchase_date') return formatDate(String(value))
    if (field === 'campus_id') return campuses.find(c => c.id === value)?.name ?? 'outro campus'
    if (field === 'responsible_id') return people.find(p => p.id === value)?.name ?? 'outra pessoa'
    return String(value)
  }

  if (entry.event_type === 'criado') {
    const campusName = show('campus_id', newV.campus_id)
    return { title, details: [`No campus ${campusName}`] }
  }

  const details = Object.keys(newV).map(field => {
    const label = FIELD_LABEL[field] ?? field
    return `${label}: ${show(field, oldV[field])} → ${show(field, newV[field])}`
  })
  return { title, details: details.length ? details : entry.description ? [entry.description] : [] }
}
