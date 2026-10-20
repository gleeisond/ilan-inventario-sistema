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
//
// Dentro da igreja, cada perfil só enxerga os próprios campus (campusVisiveis):
//   líder de campus e pastor: o campus deles | líder regional: os campus da região
//   administrador, assistência técnica e superadmin: todos
// Registros, notificações e histórico de chamados não têm campus: são sempre lidos a partir
// de um chamado ou equipamento já filtrado.

import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { getSupabase } from '@/lib/supabase'
import { getUsuarioAtual, igrejaDoContexto } from '@/lib/auth'

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

// Campus que o usuário logado pode ver. null = todos os campus da igreja.
export async function campusVisiveis(igreja: string): Promise<string[] | null> {
  const usuario = await getUsuarioAtual()
  if (!usuario) return null // modo de teste sem login
  if (usuario.role === 'lider_midia' || usuario.role === 'pastor') return usuario.campus_id ? [usuario.campus_id] : []
  if (usuario.role === 'lider_regional') {
    if (!usuario.region_id) return []
    const { data } = await getSupabase().from('campus').select('id').eq('igreja_id', igreja).eq('region_id', usuario.region_id)
    return (data ?? []).map(c => c.id as string)
  }
  return null
}

// Coluna de campus de cada tabela (as que não estão aqui não são filtradas por campus)
const COLUNA_CAMPUS: Partial<Record<TabelaDaIgreja, string>> = {
  campus: 'id',
  equipment: 'campus_id',
  maintenance_requests: 'campus_id',
}

// PostgREST: valores do filtro in.(...)
const lista = (ids: string[]) => `(${ids.map(id => `"${id}"`).join(',')})`

// igrejaId explícito é usado pelo painel da plataforma (superadmin): sem filtro de campus
export async function daIgreja(igrejaId?: string) {
  const igreja = igrejaId ?? (await igrejaDoContexto())
  const visiveis = igrejaId ? null : await campusVisiveis(igreja)
  const supabase = getSupabase()

  // Aplica a igreja e, para quem só vê alguns campus, o filtro de campus
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function filtrar<T extends { eq: any; filter: any; or: any }>(tabela: TabelaDaIgreja, consulta: T): T {
    let q = consulta.eq('igreja_id', igreja)
    if (visiveis) {
      const coluna = COLUNA_CAMPUS[tabela]
      // Usuários: os do próprio campus e os que não são de campus (administração, assistência técnica)
      if (tabela === 'users') q = q.or(`campus_id.in.${lista(visiveis)},campus_id.is.null`)
      else if (coluna) q = q.filter(coluna, 'in', lista(visiveis))
    }
    return q
  }

  return {
    igreja,
    campusVisiveis: visiveis,
    select: (tabela: TabelaDaIgreja, colunas = '*', opcoes?: OpcoesSelect) =>
      filtrar(tabela, supabase.from(tabela).select(colunas, opcoes)) as unknown as Consulta,
    insert: (tabela: TabelaDaIgreja, linhas: Linha | Linha[]) => supabase.from(tabela).insert(comIgreja(linhas, igreja)),
    update: (tabela: TabelaDaIgreja, dados: Linha, opcoes?: OpcoesEscrita) =>
      filtrar(tabela, supabase.from(tabela).update(semIgreja(dados), opcoes)),
    delete: (tabela: TabelaDaIgreja, opcoes?: OpcoesEscrita) => filtrar(tabela, supabase.from(tabela).delete(opcoes)),
  }
}

export type BancoDaIgreja = Awaited<ReturnType<typeof daIgreja>>
