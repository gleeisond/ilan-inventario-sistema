// lib/db.ts
// Acesso às tabelas de cada igreja (só no servidor).
//
// Regra: nenhuma tela ou ação consulta direto as tabelas abaixo. Tudo passa por daIgreja(),
// que já filtra pela igreja do usuário logado (ou pela igreja que o superadmin abriu) e grava
// a igreja nos registros novos. O script scripts/verificar-isolamento.mjs roda antes do build
// e barra qualquer .from() fora dos arquivos autorizados.
//
// O banco confere de novo: gatilhos (sql/06_isolamento_igrejas.sql) recusam qualquer registro
// que aponte para campus, equipamento ou usuário de outra igreja.

import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { getSupabase } from '@/lib/supabase'
import { igrejaDoContexto } from '@/lib/auth'

export const TABELAS_DA_IGREJA = [
  'regions',
  'campus',
  'users',
  'categories',
  'locations',
  'equipment',
  'maintenance_requests',
  'maintenance_logs',
  'maintenance_notifications',
  'equipment_history',
  'activity_logs',
] as const

export type TabelaDaIgreja = (typeof TABELAS_DA_IGREJA)[number]

type Linha = Record<string, unknown>
// O banco não tem tipos gerados: as linhas voltam como any, como no supabase.from(...).select() de antes.
// Quem precisa de tipo faz o cast na tela, como já era feito.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Consulta = PostgrestFilterBuilder<any, any, any, any[], string, unknown, 'GET'>
type OpcoesSelect = { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }
type OpcoesEscrita = { count?: 'exact' | 'planned' | 'estimated' }

function comIgreja<T extends Linha | Linha[]>(linhas: T, igreja: string): T {
  const marcar = (l: Linha) => ({ ...l, igreja_id: igreja })
  return (Array.isArray(linhas) ? linhas.map(marcar) : marcar(linhas)) as unknown as T
}

// A igreja de um registro nunca muda depois de criado
function semIgreja(dados: Linha) {
  const { igreja_id: _ignorado, ...resto } = dados
  return resto
}

export async function daIgreja(igrejaId?: string) {
  const igreja = igrejaId ?? (await igrejaDoContexto())
  const supabase = getSupabase()
  return {
    igreja,
    select: (tabela: TabelaDaIgreja, colunas = '*', opcoes?: OpcoesSelect) =>
      supabase.from(tabela).select(colunas, opcoes).eq('igreja_id', igreja) as unknown as Consulta,
    insert: (tabela: TabelaDaIgreja, linhas: Linha | Linha[]) => supabase.from(tabela).insert(comIgreja(linhas, igreja)),
    update: (tabela: TabelaDaIgreja, dados: Linha, opcoes?: OpcoesEscrita) =>
      supabase.from(tabela).update(semIgreja(dados), opcoes).eq('igreja_id', igreja),
    delete: (tabela: TabelaDaIgreja, opcoes?: OpcoesEscrita) => supabase.from(tabela).delete(opcoes).eq('igreja_id', igreja),
  }
}

export type BancoDaIgreja = Awaited<ReturnType<typeof daIgreja>>
