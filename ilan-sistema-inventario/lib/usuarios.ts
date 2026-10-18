// lib/usuarios.ts
// Perfis de acesso e regras de vínculo (campus/região) de cada um

import { UserRole } from '@/types/database'

export const PERFIS: UserRole[] = ['admin', 'rodrigo', 'lider_regional', 'pastor', 'lider_midia']

export const PERFIL_LABELS: Record<UserRole, string> = {
  admin: 'ADM Ilan',
  rodrigo: 'Ilan Tech Pro',
  lider_regional: 'Líder regional',
  pastor: 'Pastor de campus',
  lider_midia: 'Líder de campus',
}

export const PERFIL_DESCRICOES: Record<UserRole, string> = {
  admin: 'Acesso total. Aprova ou reprova os orçamentos de reparo e pode agir em qualquer etapa.',
  rodrigo: 'Recebe os equipamentos, faz o diagnóstico, pede aprovação dos custos e conserta ou descarta.',
  lider_regional: 'Faz a triagem dos defeitos dos campus da sua região: envia para a Ilan Tech Pro ou resolve no campus.',
  pastor: 'Leva o equipamento até a Ilan Tech Pro e traz de volta ao campus depois do conserto.',
  lider_midia: 'Cuida do inventário do seu campus, abre os chamados e instala o equipamento quando ele volta.',
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
