// lib/igrejas.ts
// Planos e situações das igrejas da plataforma

import { PlanoIgreja, SituacaoIgreja } from '@/types/database'

// Valores de referência da proposta comercial. Limites null = sem limite.
export const PLANOS: Record<PlanoIgreja, { nome: string; preco: string; campus: number | null; usuarios: number | null }> = {
  essencial: { nome: 'Essencial', preco: 'R$ 97/mês', campus: 1, usuarios: 5 },
  rede: { nome: 'Rede', preco: 'R$ 247/mês', campus: 5, usuarios: 20 },
  ministerio: { nome: 'Ministério', preco: 'R$ 497/mês', campus: 15, usuarios: null },
  sob_consulta: { nome: 'Sob consulta', preco: 'a partir de R$ 990/mês', campus: null, usuarios: null },
}

export const SITUACOES: Record<SituacaoIgreja, { nome: string; cor: string; descricao: string }> = {
  implantacao: {
    nome: 'Em implantação',
    cor: 'bg-amber-100 text-amber-800',
    descricao: 'Cadastro e filiais sendo montados. Os usuários da igreja ainda não entram.',
  },
  ativa: { nome: 'Ativa', cor: 'bg-green-100 text-green-800', descricao: 'Em uso.' },
  suspensa: { nome: 'Suspensa', cor: 'bg-red-100 text-red-800', descricao: 'Acesso bloqueado para os usuários da igreja.' },
}

// Passou do limite do plano? (só aviso: o sistema não bloqueia)
export function acimaDoLimite(usado: number, limite: number | null) {
  return limite !== null && usado > limite
}
