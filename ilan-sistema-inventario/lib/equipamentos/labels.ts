// lib/equipamentos/labels.ts
// Textos que aparecem na tela para cada valor guardado no banco.
import type { EquipmentEventType, EquipmentStatus, MaintenanceStatus, PriorityLevel, UserRole } from '@/types/database'

export const STATUS_LABEL: Record<EquipmentStatus, string> = {
  ativo: 'Ativo',
  em_manutencao: 'Em manutenção',
  danificado: 'Danificado',
  descartado: 'Baixado',
}

export const STATUS_ORDER: EquipmentStatus[] = ['ativo', 'em_manutencao', 'danificado', 'descartado']

export const CATEGORIES = [
  'Áudio',
  'Vídeo',
  'Iluminação',
  'Transmissão',
  'Informática',
  'Instrumentos',
  'Estrutura',
  'Mobiliário',
  'Outros',
]

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administração',
  lider_regional: 'Líder regional',
  pastor: 'Pastor',
  lider_midia: 'Líder de mídia',
  rodrigo: 'Técnico',
}

export const EVENT_LABEL: Record<EquipmentEventType, string> = {
  criado: 'Cadastrado',
  movido: 'Mudou de campus',
  danificado: 'Marcado como danificado',
  consertado: 'Voltou a funcionar',
  responsavel_alterado: 'Responsável alterado',
  status_alterado: 'Status alterado',
  editado: 'Dados editados',
}

export const MAINTENANCE_STATUS_LABEL: Record<MaintenanceStatus, string> = {
  aberto: 'Aberto',
  recebido: 'Recebido',
  em_diagnostico: 'Em diagnóstico',
  em_conserto: 'Em conserto',
  aguardando_pecas: 'Aguardando peças',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export const PRIORITY_LABEL: Record<PriorityLevel, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
}

// Nomes dos campos para descrever edições no histórico.
export const FIELD_LABEL: Record<string, string> = {
  name: 'Nome',
  brand: 'Marca',
  category: 'Categoria',
  value: 'Valor de compra',
  purchase_date: 'Data de compra',
  location: 'Local',
  notes: 'Observações',
  status: 'Status',
  campus_id: 'Campus',
  responsible_id: 'Responsável',
}
