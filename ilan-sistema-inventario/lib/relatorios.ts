// lib/relatorios.ts
// Consultas compartilhadas pela tela de relatórios e pela exportação em planilha

import { getSupabase } from '@/lib/supabase'
import { EquipmentStatus, MaintenanceStatus, PriorityLevel } from '@/types/database'

export type FiltrosRelatorio = { campus?: string; de?: string; ate?: string }

export type EquipamentoRelatorio = {
  id: string
  name: string
  brand: string | null
  category: string | null
  location: string | null
  status: EquipmentStatus
  value: number | null
  purchase_date: string | null
  campus_id: string
  campus: { name: string } | null
  responsible: { name: string } | null
}

export type ManutencaoRelatorio = {
  id: string
  status: MaintenanceStatus
  priority: PriorityLevel
  problem_description: string
  cost: number | null
  created_at: string
  actual_completion_date: string | null
  scheduled_completion_date: string | null
  campus_id: string
  equipment: { name: string } | null
  campus: { name: string } | null
  created_by: { name: string } | null
}

// Período padrão: do primeiro dia do mês até hoje (horário de Brasília)
export function periodoPadrao(filtros: FiltrosRelatorio) {
  const hoje = new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10)
  return { de: filtros.de || `${hoje.slice(0, 8)}01`, ate: filtros.ate || hoje }
}

export async function buscarEquipamentos(filtros: FiltrosRelatorio) {
  let query = getSupabase()
    .from('equipment')
    .select('id, name, brand, category, location, status, value, purchase_date, campus_id, campus:campus_id (name), responsible:responsible_id (name)')
    .order('name')
  if (filtros.campus) query = query.eq('campus_id', filtros.campus)
  const { data, error } = await query
  return { equipamentos: (data ?? []) as unknown as EquipamentoRelatorio[], error }
}

// Chamados abertos no período (as datas são dias em Brasília, UTC-3)
export async function buscarManutencoes(filtros: FiltrosRelatorio) {
  const { de, ate } = periodoPadrao(filtros)
  const fim = new Date(`${ate}T03:00:00Z`)
  fim.setUTCDate(fim.getUTCDate() + 1)
  let query = getSupabase()
    .from('maintenance_requests')
    .select(
      'id, status, priority, problem_description, cost, created_at, actual_completion_date, scheduled_completion_date, campus_id, equipment:equipment_id (name), campus:campus_id (name), created_by:created_by_id (name)'
    )
    .gte('created_at', `${de}T03:00:00`)
    .lt('created_at', fim.toISOString().slice(0, 19))
    .order('created_at', { ascending: false })
  if (filtros.campus) query = query.eq('campus_id', filtros.campus)
  const { data, error } = await query
  return { manutencoes: (data ?? []) as unknown as ManutencaoRelatorio[], error }
}

// Agrupa e soma por uma chave, do maior para o menor
export function agrupar<T>(itens: T[], chave: (item: T) => string, valor: (item: T) => number = () => 0) {
  const mapa = new Map<string, { nome: string; total: number; valor: number }>()
  for (const item of itens) {
    const nome = chave(item)
    const atual = mapa.get(nome) ?? { nome, total: 0, valor: 0 }
    atual.total += 1
    atual.valor += valor(item)
    mapa.set(nome, atual)
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'))
}

// Dias entre a abertura do chamado e a entrega
export function diasParaResolver(m: ManutencaoRelatorio) {
  if (!m.actual_completion_date) return null
  const aberto = new Date(m.created_at.slice(0, 10) + 'T00:00:00Z')
  const entregue = new Date(m.actual_completion_date + 'T00:00:00Z')
  return Math.max(0, Math.round((entregue.getTime() - aberto.getTime()) / 86_400_000))
}
