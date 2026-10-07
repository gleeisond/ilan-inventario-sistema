// types/database.ts
// Tipos baseados no schema SQL

export type UserRole = 'lider_midia' | 'pastor' | 'rodrigo' | 'lider_regional' | 'admin'
export type EquipmentStatus = 'ativo' | 'danificado' | 'em_manutencao' | 'descartado'
export type MaintenanceStatus =
  | 'aberto'
  | 'aguardando_envio'
  | 'recebido'
  | 'em_diagnostico'
  | 'em_conserto'
  | 'aguardando_pecas'
  | 'aguardando_aprovacao'
  | 'reprovado'
  | 'pronto'
  | 'aguardando_instalacao'
  | 'concluido'
  | 'descartado'
  | 'entregue'
  | 'cancelado'
export type PriorityLevel = 'baixa' | 'media' | 'alta' | 'critica'
export type ActionType =
  | 'recebido'
  | 'diagnosticado'
  | 'conserto_iniciado'
  | 'peca_solicitada'
  | 'peca_recebida'
  | 'conserto_completo'
  | 'pronto_para_entrega'
  | 'entregue'
  | 'enviado_assistencia'
  | 'resolvido_no_campus'
  | 'orcamento_solicitado'
  | 'orcamento_aprovado'
  | 'orcamento_reprovado'
  | 'descartado'
  | 'devolvido_sem_conserto'
  | 'retirado_assistencia'
  | 'instalado'
  | 'reaberto'
export type NotificationType = 'pronto_para_buscar' | 'pronto' | 'aguardando_pecas' | 'atrasado' | 'nova_requisicao'

// Tabelas
export interface Region {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Campus {
  id: string
  name: string
  location?: string
  region_id: string
  pastor_id?: string
  lider_midia_id?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  campus_id?: string
  region_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Equipment {
  id: string
  name: string
  brand?: string
  category?: string
  value?: number
  purchase_date?: string
  campus_id: string
  responsible_id?: string
  status: EquipmentStatus
  location?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface MaintenanceRequest {
  id: string
  equipment_id: string
  campus_id: string
  created_by_id: string
  problem_description: string
  status: MaintenanceStatus
  priority: PriorityLevel
  assigned_to_id?: string
  scheduled_completion_date?: string
  actual_completion_date?: string
  cost?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface MaintenanceLog {
  id: string
  maintenance_request_id: string
  action_type: ActionType
  description?: string
  notes?: string
  performed_by_id: string
  created_at: string
}

export interface MaintenanceNotification {
  id: string
  maintenance_request_id: string
  recipient_id: string
  notification_type: NotificationType
  message: string
  is_read: boolean
  sent_at: string
  read_at?: string
}

export interface EquipmentHistory {
  id: string
  equipment_id: string
  event_type: string
  description?: string
  changed_by_id: string
  old_value?: Record<string, any>
  new_value?: Record<string, any>
  created_at: string
}
