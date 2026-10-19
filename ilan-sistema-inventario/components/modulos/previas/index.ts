// Uma prévia por módulo que ainda não está no ar. O patrimônio não tem prévia: ele é o próprio sistema.
import type { ComponentType } from 'react'
import type { IdModulo } from '@/lib/modulos'
import PreviaContabilidade from './Contabilidade'
import PreviaMembros from './Membros'
import PreviaMinisterios from './Ministerios'
import PreviaPessoal from './Pessoal'
import PreviaTesouraria from './Tesouraria'

export const PREVIAS: Partial<Record<IdModulo, ComponentType>> = {
  tesouraria: PreviaTesouraria,
  contabilidade: PreviaContabilidade,
  pessoal: PreviaPessoal,
  membros: PreviaMembros,
  ministerios: PreviaMinisterios,
}
