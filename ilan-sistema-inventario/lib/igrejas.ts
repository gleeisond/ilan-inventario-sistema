// lib/igrejas.ts
// Planos e situações das igrejas da plataforma

import { PlanoIgreja, SituacaoIgreja } from '@/types/database'

// Valores de referência da proposta comercial. Limites null = sem limite.
// valor: mensalidade padrão, usada quando a igreja não tem um valor combinado (igrejas.valor_mensal)
export const PLANOS: Record<PlanoIgreja, { nome: string; preco: string; valor: number; campus: number | null; usuarios: number | null }> = {
  essencial: { nome: 'Essencial', preco: 'R$ 97/mês', valor: 97, campus: 1, usuarios: 5 },
  rede: { nome: 'Rede', preco: 'R$ 247/mês', valor: 247, campus: 5, usuarios: 20 },
  ministerio: { nome: 'Ministério', preco: 'R$ 497/mês', valor: 497, campus: 15, usuarios: null },
  sob_consulta: { nome: 'Sob consulta', preco: 'a partir de R$ 990/mês', valor: 990, campus: null, usuarios: null },
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

// Mensagem de limite do plano atingido, ou null se ainda cabe mais um
export function limiteAtingido(plano: PlanoIgreja, tipo: 'campus' | 'usuarios', usados: number) {
  const p = PLANOS[plano]
  const limite = p[tipo]
  if (limite === null || usados < limite) return null
  const coisa = tipo === 'campus' ? 'campus' : limite === 1 ? 'usuário ativo' : 'usuários ativos'
  return `O plano ${p.nome} permite até ${limite} ${coisa}. Para ter mais, fale com a Genesis41 sobre mudar de plano.`
}
