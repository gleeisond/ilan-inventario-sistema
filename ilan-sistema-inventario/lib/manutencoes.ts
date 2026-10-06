// lib/manutencoes.ts
// Rótulos e cores compartilhados pelas telas de manutenção

import { ActionType, MaintenanceStatus, PriorityLevel } from '@/types/database'

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

export const MANUTENCAO_STATUS_COLORS: Record<MaintenanceStatus, string> = {
  aberto: 'bg-gray-100 text-gray-700',
  recebido: 'bg-blue-100 text-blue-800',
  em_diagnostico: 'bg-indigo-100 text-indigo-800',
  em_conserto: 'bg-yellow-100 text-yellow-800',
  aguardando_pecas: 'bg-orange-100 text-orange-800',
  pronto: 'bg-green-100 text-green-800',
  entregue: 'bg-gray-200 text-gray-700',
  cancelado: 'bg-gray-200 text-gray-500',
}

// Registro que entra no histórico quando o status muda (o enum action_type não tem "aberto" nem "cancelado")
export const ACAO_POR_STATUS: Partial<Record<MaintenanceStatus, ActionType>> = {
  recebido: 'recebido',
  em_diagnostico: 'diagnosticado',
  em_conserto: 'conserto_iniciado',
  aguardando_pecas: 'peca_solicitada',
  pronto: 'pronto_para_entrega',
  entregue: 'entregue',
}

export const ACAO_LABELS: Record<ActionType, string> = {
  recebido: 'Equipamento recebido',
  diagnosticado: 'Diagnóstico feito',
  conserto_iniciado: 'Conserto iniciado',
  peca_solicitada: 'Peça solicitada',
  peca_recebida: 'Peça recebida',
  conserto_completo: 'Conserto concluído',
  pronto_para_entrega: 'Pronto para buscar',
  entregue: 'Entregue ao campus',
}

export function descreverPrazo(atraso: number | null) {
  if (atraso === null) return null
  if (atraso > 0) return `${atraso} dia(s) de atraso`
  if (atraso === 0) return 'previsto para hoje'
  return `previsto em ${-atraso} dia(s)`
}

export function formatarData(data: string | null | undefined) {
  if (!data) return '—'
  const [ano, mes, dia] = data.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}
