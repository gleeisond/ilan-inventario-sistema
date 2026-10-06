// lib/equipamentos.ts
// Rótulos e cores compartilhados pelas telas de equipamentos

import { EquipmentStatus } from '@/types/database'

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

export const CATEGORIAS = ['câmera', 'áudio', 'projetor', 'luz', 'computador', 'cabo', 'tripé', 'outro']

export function formatarMoeda(valor?: number | null) {
  if (valor == null) return '—'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
