// lib/equipamentos.ts
// Rótulos e cores compartilhados pelas telas de equipamentos

import { EquipmentStatus, UserRole } from '@/types/database'

export const STATUS_LABELS: Record<EquipmentStatus, string> = {
  ativo: 'Ativo',
  danificado: 'Danificado',
  em_manutencao: 'Em manutenção',
  descartado: 'Descartado',
}

export const STATUS_COLORS: Record<EquipmentStatus, string> = {
  ativo: 'bg-green-100 text-green-800',
  danificado: 'bg-red-100 text-red-800',
  em_manutencao: 'bg-yellow-100 text-yellow-800',
  descartado: 'bg-gray-200 text-gray-700',
}


export function formatarMoeda(valor?: number | null) {
  if (valor == null) return '—'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Aceita "4.250,90" (formato brasileiro) e "4250.90". Retorna null se vazio e NaN se inválido.
export function lerMoeda(valorTexto: string | null) {
  if (!valorTexto) return null
  const normalizado = valorTexto.includes(',') ? valorTexto.replace(/\./g, '').replace(',', '.') : valorTexto
  return Number(normalizado)
}

// ---------- Permissões ----------
// Com o login desligado (usuario null) todos podem tudo, como no resto do sistema.
// ADM Ilan mexe em qualquer campus; líder de campus e pastor só no próprio campus;
// líder regional nos campus da sua região. O Ilan Tech Pro cuida do reparo, não do cadastro.

type QuemMexe = { role: UserRole; campus_id: string | null; region_id: string | null } | null
export type CampusDoEquipamento = { id: string; region_id: string | null }

export function podeEditarNoCampus(usuario: QuemMexe, campus: CampusDoEquipamento) {
  if (!usuario || usuario.role === 'admin') return true
  if (usuario.role === 'lider_midia' || usuario.role === 'pastor') return usuario.campus_id === campus.id
  if (usuario.role === 'lider_regional') return Boolean(usuario.region_id) && usuario.region_id === campus.region_id
  return false
}

// Excluir apaga também o histórico do equipamento, então fica só com o ADM Ilan
export function podeExcluirEquipamento(usuario: QuemMexe) {
  return !usuario || usuario.role === 'admin'
}
