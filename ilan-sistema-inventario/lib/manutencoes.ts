// lib/manutencoes.ts
// Rótulos e cores compartilhados pelas telas de manutenção

import { MaintenanceStatus, PriorityLevel } from '@/types/database'

export const MANUTENCAO_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  aberto: 'Aberto',
  recebido: 'Recebido',
  em_diagnostico: 'Em diagnóstico',
  em_conserto: 'Em conserto',
  aguardando_pecas: 'Aguardando peças',
  pronto: 'Pronto para buscar',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export const PRIORIDADE_LABELS: Record<PriorityLevel, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
}

export const PRIORIDADE_COLORS: Record<PriorityLevel, string> = {
  baixa: 'bg-gray-100 text-gray-700',
  media: 'bg-blue-100 text-blue-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800',
}

export const PRIORIDADE_ORDEM: Record<PriorityLevel, number> = { critica: 0, alta: 1, media: 2, baixa: 3 }

export const STATUS_FINALIZADOS: MaintenanceStatus[] = ['entregue', 'cancelado']

// Dias de atraso em relação à data prevista (negativo = ainda no prazo)
export function diasDeAtraso(dataPrevista: string | null, hoje = new Date()) {
  if (!dataPrevista) return null
  const prevista = new Date(dataPrevista + 'T00:00:00')
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  return Math.round((inicioHoje.getTime() - prevista.getTime()) / 86_400_000)
}
