// lib/fluxoReparo.ts
// Fluxo de reparo: quem age em cada etapa do chamado e o que pode fazer

import { ActionType, MaintenanceStatus, UserRole } from '@/types/database'

// Etapas mostradas na linha do tempo do chamado, na ordem em que acontecem
export const ETAPAS: { titulo: string; quem: UserRole; status: MaintenanceStatus[] }[] = [
  { titulo: 'Defeito detectado', quem: 'lider_midia', status: [] },
  { titulo: 'Triagem', quem: 'lider_regional', status: ['aberto'] },
  { titulo: 'Levar à Ilan Tech Pro', quem: 'pastor', status: ['aguardando_envio'] },
  { titulo: 'Diagnóstico e conserto', quem: 'rodrigo', status: ['recebido', 'em_diagnostico', 'em_conserto', 'aguardando_pecas', 'reprovado'] },
  { titulo: 'Aprovação do orçamento', quem: 'admin', status: ['aguardando_aprovacao'] },
  { titulo: 'Retirar e devolver ao campus', quem: 'pastor', status: ['pronto'] },
  { titulo: 'Instalar no campus', quem: 'lider_midia', status: ['aguardando_instalacao'] },
]

// Índice da etapa atual na linha do tempo (as etapas antes dela estão feitas)
export function etapaAtual(status: MaintenanceStatus) {
  if (['concluido', 'entregue'].includes(status)) return ETAPAS.length
  const i = ETAPAS.findIndex(e => e.status.includes(status))
  return i === -1 ? null : i
}

// Quem precisa agir em cada status (null = chamado encerrado)
export function responsavelPor(status: MaintenanceStatus): UserRole | null {
  return ETAPAS.find(e => e.status.includes(status))?.quem ?? null
}

export type AcaoFluxo = {
  id: string
  rotulo: string
  para: MaintenanceStatus
  registro: ActionType
  estilo: 'principal' | 'secundario' | 'perigo'
  exigeComentario?: string // texto de ajuda; quando presente o comentário é obrigatório
  exigeCusto?: boolean
}

const PEDIR_APROVACAO: AcaoFluxo = {
  id: 'pedir_aprovacao',
  rotulo: 'Pedir aprovação do orçamento',
  para: 'aguardando_aprovacao',
  registro: 'orcamento_solicitado',
  estilo: 'principal',
  exigeComentario: 'O que precisa ser feito e por quê',
  exigeCusto: true,
}
const CONSERTAR_SEM_CUSTO: AcaoFluxo = {
  id: 'consertar',
  rotulo: 'Consertar sem custo',
  para: 'em_conserto',
  registro: 'conserto_iniciado',
  estilo: 'secundario',
}
const CONSERTO_PRONTO: AcaoFluxo = {
  id: 'conserto_pronto',
  rotulo: 'Conserto pronto para retirada',
  para: 'pronto',
  registro: 'conserto_completo',
  estilo: 'principal',
}

export const ACOES_POR_STATUS: Partial<Record<MaintenanceStatus, AcaoFluxo[]>> = {
  aberto: [
    { id: 'enviar', rotulo: 'Enviar para a Ilan Tech Pro', para: 'aguardando_envio', registro: 'enviado_assistencia', estilo: 'principal' },
    {
      id: 'resolver_no_campus',
      rotulo: 'Resolver no campus',
      para: 'cancelado',
      registro: 'resolvido_no_campus',
      estilo: 'secundario',
      exigeComentario: 'Como o problema vai ser resolvido no campus',
    },
  ],
  aguardando_envio: [
    { id: 'levou', rotulo: 'Entreguei na Ilan Tech Pro', para: 'recebido', registro: 'recebido', estilo: 'principal' },
  ],
  recebido: [
    { id: 'diagnosticar', rotulo: 'Iniciar diagnóstico', para: 'em_diagnostico', registro: 'diagnosticado', estilo: 'secundario' },
    PEDIR_APROVACAO,
    CONSERTAR_SEM_CUSTO,
  ],
  em_diagnostico: [PEDIR_APROVACAO, CONSERTAR_SEM_CUSTO],
  em_conserto: [
    CONSERTO_PRONTO,
    { id: 'aguardar_pecas', rotulo: 'Aguardando peças', para: 'aguardando_pecas', registro: 'peca_solicitada', estilo: 'secundario' },
    { ...PEDIR_APROVACAO, rotulo: 'Pedir aprovação de custo extra', estilo: 'secundario' },
  ],
  aguardando_pecas: [
    { id: 'pecas_chegaram', rotulo: 'Peças chegaram', para: 'em_conserto', registro: 'peca_recebida', estilo: 'secundario' },
    CONSERTO_PRONTO,
  ],
  aguardando_aprovacao: [
    { id: 'aprovar', rotulo: 'Aprovar orçamento', para: 'em_conserto', registro: 'orcamento_aprovado', estilo: 'principal' },
    {
      id: 'reprovar',
      rotulo: 'Reprovar orçamento',
      para: 'reprovado',
      registro: 'orcamento_reprovado',
      estilo: 'perigo',
      exigeComentario: 'Motivo da reprovação',
    },
  ],
  reprovado: [
    {
      id: 'devolver',
      rotulo: 'Devolver sem conserto',
      para: 'pronto',
      registro: 'devolvido_sem_conserto',
      estilo: 'secundario',
      exigeComentario: 'Em que estado o equipamento volta',
    },
    {
      id: 'descartar',
      rotulo: 'Descartar equipamento',
      para: 'descartado',
      registro: 'descartado',
      estilo: 'perigo',
      exigeComentario: 'Motivo do descarte',
    },
  ],
  pronto: [
    { id: 'retirou', rotulo: 'Retirei e levei ao campus', para: 'aguardando_instalacao', registro: 'retirado_assistencia', estilo: 'principal' },
  ],
  aguardando_instalacao: [
    { id: 'instalado', rotulo: 'Instalado e funcionando', para: 'concluido', registro: 'instalado', estilo: 'principal' },
    {
      id: 'reabrir',
      rotulo: 'Continua com defeito',
      para: 'aberto',
      registro: 'reaberto',
      estilo: 'perigo',
      exigeComentario: 'O que ainda não funciona',
    },
  ],
}

export function acoesDisponiveis(status: MaintenanceStatus) {
  return ACOES_POR_STATUS[status] ?? []
}

export type QuemAge = { role: UserRole; campus_id: string | null; region_id: string | null }
export type ChamadoDoFluxo = { status: MaintenanceStatus; campus_id: string; campus_region_id: string | null }

// A etapa atual é deste usuário? (base da fila "Aguardando você")
// Líder de campus e pastor só no próprio campus; líder regional só nos campus da sua região.
export function aguardaUsuario(usuario: QuemAge, chamado: ChamadoDoFluxo) {
  const responsavel = responsavelPor(chamado.status)
  if (!responsavel || usuario.role !== responsavel) return false
  if (responsavel === 'lider_midia' || responsavel === 'pastor') return usuario.campus_id === chamado.campus_id
  if (responsavel === 'lider_regional') return Boolean(usuario.region_id) && usuario.region_id === chamado.campus_region_id
  return true
}

// Com o login desligado (usuario null) todos podem agir; o admin age em qualquer etapa.
export function podeAgir(usuario: QuemAge | null, chamado: ChamadoDoFluxo) {
  if (!responsavelPor(chamado.status)) return false
  if (!usuario || usuario.role === 'admin') return true
  return aguardaUsuario(usuario, chamado)
}
