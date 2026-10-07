// lib/manutencoes.ts
// Rótulos e cores compartilhados pelas telas de manutenção

import { ActionType, MaintenanceStatus, PriorityLevel } from '@/types/database'

export const MANUTENCAO_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  aberto: 'Aguardando triagem',
  aguardando_envio: 'Aguardando levar à Ilan Tech Pro',
  recebido: 'Na Ilan Tech Pro',
  em_diagnostico: 'Em diagnóstico',
  em_conserto: 'Em conserto',
  aguardando_pecas: 'Aguardando peças',
  aguardando_aprovacao: 'Aguardando aprovação do orçamento',
  reprovado: 'Orçamento reprovado',
  pronto: 'Pronto para retirada',
  aguardando_instalacao: 'Aguardando instalação',
  concluido: 'Concluído',
  descartado: 'Descartado',
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

export const STATUS_FINALIZADOS: MaintenanceStatus[] = ['concluido', 'descartado', 'entregue', 'cancelado']

// Dias de atraso em relação à data prevista (negativo = ainda no prazo)
export function diasDeAtraso(dataPrevista: string | null, hoje = new Date()) {
  if (!dataPrevista) return null
  const prevista = new Date(dataPrevista + 'T00:00:00')
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  return Math.round((inicioHoje.getTime() - prevista.getTime()) / 86_400_000)
}

export const MANUTENCAO_STATUS_COLORS: Record<MaintenanceStatus, string> = {
  aberto: 'bg-gray-100 text-gray-700',
  aguardando_envio: 'bg-sky-100 text-sky-800',
  recebido: 'bg-blue-100 text-blue-800',
  em_diagnostico: 'bg-indigo-100 text-indigo-800',
  em_conserto: 'bg-yellow-100 text-yellow-800',
  aguardando_pecas: 'bg-orange-100 text-orange-800',
  aguardando_aprovacao: 'bg-purple-100 text-purple-800',
  reprovado: 'bg-red-100 text-red-800',
  pronto: 'bg-green-100 text-green-800',
  aguardando_instalacao: 'bg-teal-100 text-teal-800',
  concluido: 'bg-gray-200 text-gray-700',
  descartado: 'bg-gray-200 text-gray-500',
  entregue: 'bg-gray-200 text-gray-700',
  cancelado: 'bg-gray-200 text-gray-500',
}

// Registro que entra no histórico quando o admin corrige o status à mão (o enum action_type não tem "aberto" nem "cancelado")
export const ACAO_POR_STATUS: Partial<Record<MaintenanceStatus, ActionType>> = {
  recebido: 'recebido',
  em_diagnostico: 'diagnosticado',
  em_conserto: 'conserto_iniciado',
  aguardando_pecas: 'peca_solicitada',
  pronto: 'pronto_para_entrega',
  entregue: 'entregue',
  aguardando_envio: 'enviado_assistencia',
  aguardando_aprovacao: 'orcamento_solicitado',
  reprovado: 'orcamento_reprovado',
  aguardando_instalacao: 'retirado_assistencia',
  concluido: 'instalado',
  descartado: 'descartado',
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
  enviado_assistencia: 'Triagem: enviar à Ilan Tech Pro',
  resolvido_no_campus: 'Triagem: resolver no campus',
  orcamento_solicitado: 'Orçamento enviado para aprovação',
  orcamento_aprovado: 'Orçamento aprovado',
  orcamento_reprovado: 'Orçamento reprovado',
  descartado: 'Equipamento descartado',
  devolvido_sem_conserto: 'Devolvido sem conserto',
  retirado_assistencia: 'Retirado da Ilan Tech Pro',
  instalado: 'Instalado e funcionando',
  reaberto: 'Chamado reaberto',
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
