// lib/usuarios.ts
// Perfis de acesso e regras de vínculo (campus/região) de cada um

import { UserRole } from '@/types/database'

export const PERFIS: UserRole[] = ['admin', 'rodrigo', 'lider_regional', 'pastor', 'lider_midia']

export const PERFIL_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  rodrigo: 'Assistência técnica',
  lider_regional: 'Líder regional',
  pastor: 'Pastor',
  lider_midia: 'Líder de mídia',
}

export const PERFIL_DESCRICOES: Record<UserRole, string> = {
  admin: 'Acesso total: todos os campus, usuários e configurações.',
  rodrigo: 'Recebe os equipamentos e atualiza o andamento das manutenções de todos os campus.',
  lider_regional: 'Acompanha os campus da sua região.',
  pastor: 'Acompanha o inventário e as manutenções do seu campus.',
  lider_midia: 'Cuida do inventário do seu campus e abre chamados de manutenção.',
}

export const PERFIL_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-800',
  rodrigo: 'bg-blue-100 text-blue-800',
  lider_regional: 'bg-teal-100 text-teal-800',
  pastor: 'bg-amber-100 text-amber-800',
  lider_midia: 'bg-indigo-100 text-indigo-800',
}

// Qual vínculo cada perfil exige
export const PERFIL_VINCULO: Record<UserRole, 'campus' | 'regiao' | null> = {
  admin: null,
  rodrigo: null,
  lider_regional: 'regiao',
  pastor: 'campus',
  lider_midia: 'campus',
}
