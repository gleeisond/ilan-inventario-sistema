// lib/equipamentos/permissions.ts
// O que cada perfil pode fazer na tela. A regra que vale de verdade está no RLS do banco
// (sql/001_equipamentos_rls_historico.sql); aqui só escondemos botões que dariam erro.
import type { Campus, Equipment, User } from '@/types/database'

export function canCreateEquipment(profile: User): boolean {
  return ['admin', 'lider_regional', 'lider_midia'].includes(profile.role)
}

export function canEditEquipment(profile: User, equipment: Pick<Equipment, 'campus_id'>, campuses: Campus[]): boolean {
  if (profile.role === 'admin') return true
  if (profile.role === 'lider_midia') return equipment.campus_id === profile.campus_id
  if (profile.role === 'lider_regional') {
    const campus = campuses.find(c => c.id === equipment.campus_id)
    return !!campus && campus.region_id === profile.region_id
  }
  return false
}

export function canDeleteEquipment(profile: User): boolean {
  return profile.role === 'admin'
}

// Campus em que a pessoa pode cadastrar ou para onde pode mover um equipamento.
export function editableCampuses(profile: User, campuses: Campus[]): Campus[] {
  if (profile.role === 'admin') return campuses
  if (profile.role === 'lider_regional') return campuses.filter(c => c.region_id === profile.region_id)
  if (profile.role === 'lider_midia') return campuses.filter(c => c.id === profile.campus_id)
  return []
}
