// lib/equipamentos/repo.ts
// Leitura e gravação de equipamentos. Usa o Supabase quando configurado
// e os dados de exemplo do navegador no modo demonstração.
import { DEMO_MODE, getSupabase } from '@/lib/supabase'
import type {
  Campus,
  Equipment,
  EquipmentHistoryWithUser,
  EquipmentMaintenanceSummary,
  EquipmentWithRelations,
  User,
} from '@/types/database'
import { demoId, loadDemo, saveDemo } from './demo'
import { historyForUpdate } from './history'

export type EquipmentInput = Pick<Equipment, 'name' | 'campus_id' | 'status'> & {
  brand: string | null
  category: string | null
  value: number | null
  purchase_date: string | null
  location: string | null
  notes: string | null
  responsible_id: string | null
}

export type Person = Pick<User, 'id' | 'name' | 'campus_id' | 'role'>

const SELECT_WITH_RELATIONS = '*, campus:campus_id (name), responsible:responsible_id (name)'

// Erros do banco em linguagem de gente.
function friendly(error: { code?: string; message?: string } | null, action: string): Error {
  if (!error) return new Error(`Não foi possível ${action}.`)
  if (error.code === '42501' || /row-level security|permission denied/i.test(error.message ?? '')) {
    return new Error(`Você não tem permissão para ${action}.`)
  }
  if (error.code === 'PGRST116') return new Error('Equipamento não encontrado.')
  return new Error(`Não foi possível ${action}. ${error.message ?? ''}`.trim())
}

function withRelations(e: Equipment, campuses: Campus[], users: User[]): EquipmentWithRelations {
  const campus = campuses.find(c => c.id === e.campus_id)
  const responsible = users.find(u => u.id === e.responsible_id)
  return { ...e, campus: campus ? { name: campus.name } : null, responsible: responsible ? { name: responsible.name } : null }
}

// Campos opcionais vazios viram undefined no tipo Equipment.
function toEquipment(input: EquipmentInput) {
  return {
    ...input,
    brand: input.brand ?? undefined,
    category: input.category ?? undefined,
    value: input.value ?? undefined,
    purchase_date: input.purchase_date ?? undefined,
    location: input.location ?? undefined,
    notes: input.notes ?? undefined,
    responsible_id: input.responsible_id ?? undefined,
  }
}

export async function listEquipment(): Promise<EquipmentWithRelations[]> {
  if (DEMO_MODE) {
    const db = loadDemo()
    return db.equipment.map(e => withRelations(e, db.campuses, db.users)).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
  const { data, error } = await getSupabase().from('equipment').select(SELECT_WITH_RELATIONS).order('name')
  if (error) throw friendly(error, 'carregar os equipamentos')
  return (data ?? []) as EquipmentWithRelations[]
}

export async function getEquipment(id: string): Promise<EquipmentWithRelations | null> {
  if (DEMO_MODE) {
    const db = loadDemo()
    const e = db.equipment.find(x => x.id === id)
    return e ? withRelations(e, db.campuses, db.users) : null
  }
  const { data, error } = await getSupabase().from('equipment').select(SELECT_WITH_RELATIONS).eq('id', id).maybeSingle()
  if (error) throw friendly(error, 'carregar o equipamento')
  return data as EquipmentWithRelations | null
}

export async function createEquipment(input: EquipmentInput, actorId: string): Promise<Equipment> {
  if (DEMO_MODE) {
    const db = loadDemo()
    const now = new Date().toISOString()
    const created: Equipment = { ...toEquipment(input), id: demoId('eq'), created_at: now, updated_at: now }
    db.equipment.push(created)
    db.history.push({
      id: demoId('h'), equipment_id: created.id, event_type: 'criado', description: 'Equipamento cadastrado',
      changed_by_id: actorId, new_value: { campus_id: created.campus_id }, created_at: now,
    })
    saveDemo(db)
    return created
  }
  const { data, error } = await getSupabase().from('equipment').insert(input).select().single()
  if (error) throw friendly(error, 'cadastrar o equipamento')
  return data as Equipment
}

export async function updateEquipment(id: string, changes: Partial<EquipmentInput>, actorId: string): Promise<Equipment> {
  if (DEMO_MODE) {
    const db = loadDemo()
    const index = db.equipment.findIndex(x => x.id === id)
    if (index < 0) throw new Error('Equipamento não encontrado.')
    const before = db.equipment[index]
    const now = new Date().toISOString()
    const after: Equipment = { ...before, ...toEquipment({ ...(before as unknown as EquipmentInput), ...changes }), updated_at: now }
    db.equipment[index] = after
    for (const entry of historyForUpdate(before, after)) {
      db.history.push({ id: demoId('h'), equipment_id: id, changed_by_id: actorId, created_at: now, ...entry, old_value: entry.old_value ?? undefined, new_value: entry.new_value ?? undefined })
    }
    saveDemo(db)
    return after
  }
  const { data, error } = await getSupabase()
    .from('equipment')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw friendly(error, 'salvar as alterações')
  return data as Equipment
}

export async function deleteEquipment(id: string): Promise<void> {
  if (DEMO_MODE) {
    const db = loadDemo()
    db.equipment = db.equipment.filter(e => e.id !== id)
    db.history = db.history.filter(h => h.equipment_id !== id)
    db.maintenance = db.maintenance.filter(m => m.equipment_id !== id)
    saveDemo(db)
    return
  }
  const { error, count } = await getSupabase().from('equipment').delete({ count: 'exact' }).eq('id', id)
  if (error) throw friendly(error, 'excluir o equipamento')
  if (count === 0) throw new Error('Você não tem permissão para excluir este equipamento.')
}

export async function listCampuses(): Promise<Campus[]> {
  if (DEMO_MODE) return [...loadDemo().campuses].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const { data, error } = await getSupabase().from('campus').select('*').order('name')
  if (error) throw friendly(error, 'carregar os campus')
  return (data ?? []) as Campus[]
}

export async function listPeople(): Promise<Person[]> {
  if (DEMO_MODE) {
    return loadDemo().users.map(({ id, name, campus_id, role }) => ({ id, name, campus_id, role }))
  }
  const { data, error } = await getSupabase().from('users').select('id, name, campus_id, role').eq('is_active', true).order('name')
  if (error) throw friendly(error, 'carregar as pessoas')
  return (data ?? []) as Person[]
}

export async function getHistory(equipmentId: string): Promise<EquipmentHistoryWithUser[]> {
  if (DEMO_MODE) {
    const db = loadDemo()
    return db.history
      .filter(h => h.equipment_id === equipmentId)
      .map(h => {
        const user = db.users.find(u => u.id === h.changed_by_id)
        return { ...h, changed_by: user ? { name: user.name } : null }
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  const { data, error } = await getSupabase()
    .from('equipment_history')
    .select('*, changed_by:changed_by_id (name)')
    .eq('equipment_id', equipmentId)
    .order('created_at', { ascending: false })
  if (error) throw friendly(error, 'carregar o histórico')
  return (data ?? []) as EquipmentHistoryWithUser[]
}

export async function getMaintenance(equipmentId: string): Promise<EquipmentMaintenanceSummary[]> {
  if (DEMO_MODE) {
    return loadDemo()
      .maintenance.filter(m => m.equipment_id === equipmentId)
      .map(({ id, status, priority, problem_description, cost, created_at }) => ({ id, status, priority, problem_description, cost, created_at }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  const { data, error } = await getSupabase()
    .from('maintenance_requests')
    .select('id, status, priority, problem_description, cost, created_at')
    .eq('equipment_id', equipmentId)
    .order('created_at', { ascending: false })
  if (error) throw friendly(error, 'carregar as manutenções')
  return (data ?? []) as EquipmentMaintenanceSummary[]
}
