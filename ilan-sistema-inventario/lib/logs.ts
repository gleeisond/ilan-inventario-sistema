// lib/logs.ts
// Rótulos das ações registradas em activity_logs

import { AcaoLog } from '@/lib/auth'

export const ACAO_LOG_LABELS: Record<AcaoLog, string> = {
  login: 'Entrou',
  login_falhou: 'Login falhou',
  logout: 'Saiu',
  equipamento_criado: 'Equipamento cadastrado',
  manutencao_aberta: 'Chamado aberto',
  manutencao_atualizada: 'Chamado atualizado',
  usuario_criado: 'Usuário cadastrado',
  usuario_editado: 'Usuário editado',
  senha_definida: 'Senha definida',
}

export const ACAO_LOG_COLORS: Record<AcaoLog, string> = {
  login: 'bg-gray-100 text-gray-700',
  login_falhou: 'bg-red-100 text-red-800',
  logout: 'bg-gray-100 text-gray-700',
  equipamento_criado: 'bg-green-100 text-green-800',
  manutencao_aberta: 'bg-yellow-100 text-yellow-800',
  manutencao_atualizada: 'bg-blue-100 text-blue-800',
  usuario_criado: 'bg-purple-100 text-purple-800',
  usuario_editado: 'bg-purple-100 text-purple-800',
  senha_definida: 'bg-purple-100 text-purple-800',
}

export const LINK_ENTIDADE: Record<string, (id: string) => string> = {
  maintenance_request: id => `/manutencoes/${id}`,
  user: id => `/usuarios/${id}`,
  equipment: () => '/equipamentos',
}
