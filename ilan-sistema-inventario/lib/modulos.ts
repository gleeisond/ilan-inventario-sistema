// lib/modulos.ts
// Catálogo dos módulos do Genesis41. É a fonte única para a vitrine (/plataforma/modulos),
// para os módulos contratados de cada igreja (igrejas.modulos) e para o roteiro de desenvolvimento.
// Para criar um módulo novo: acrescente aqui e crie a prévia em components/modulos/previas/.

export type IdModulo = 'patrimonio' | 'tesouraria' | 'contabilidade' | 'pessoal' | 'membros' | 'ministerios'

// no_ar: em uso pelas igrejas | previa: telas de demonstração com dados de exemplo
export type SituacaoModulo = 'no_ar' | 'previa'

export type Modulo = {
  id: IdModulo
  nome: string
  // Uma frase: o problema que o módulo resolve
  resumo: string
  paraQuem: string
  situacao: SituacaoModulo
  // Ordem sugerida de construção (o patrimônio já está no ar)
  ordem: number
  funcionalidades: string[]
  // O que este módulo entrega para os outros
  integracoes: { com: IdModulo; como: string }[]
  // O que muda para o escritório contábil parceiro
  ganhoContador: string
}

export const MODULOS: Modulo[] = [
  {
    id: 'patrimonio',
    nome: 'Patrimônio e Manutenção',
    resumo: 'Inventário dos bens de cada campus e o reparo de equipamentos com aprovação de orçamento.',
    paraQuem: 'Líderes de campus, pastores, técnico de manutenção e administração',
    situacao: 'no_ar',
    ordem: 0,
    funcionalidades: [
      'Inventário por campus com valor, categoria, local e responsável',
      'Chamados de reparo com etapas, responsáveis e prazos',
      'Aprovação do orçamento pela administração antes do conserto',
      'Baixa de bens com motivo e histórico',
      'Relatórios e planilhas por campus e período',
      'Registro de todas as ações (quem fez o quê e quando)',
    ],
    integracoes: [
      { com: 'contabilidade', como: 'Valor e data de compra dos bens geram a depreciação mensal automaticamente' },
      { com: 'tesouraria', como: 'Orçamentos de reparo aprovados viram contas a pagar' },
      { com: 'ministerios', como: 'Equipamentos reservados para cultos e eventos da escala' },
    ],
    ganhoContador: 'Imobilizado conciliado com o inventário real, sem planilha paralela.',
  },
  {
    id: 'tesouraria',
    nome: 'Tesouraria',
    resumo: 'Entradas e saídas de cada campus num só lugar, com comprovante e prestação de contas mensal.',
    paraQuem: 'Tesoureiros dos campus e tesouraria central',
    situacao: 'previa',
    ordem: 1,
    funcionalidades: [
      'Dízimos, ofertas e campanhas por culto, com contagem conferida por duas pessoas',
      'Saídas com foto do comprovante e aprovação por valor',
      'Caixa e conta bancária por campus',
      'Contas a pagar e a receber com lembrete de vencimento',
      'Conciliação com o extrato do banco (arquivo OFX)',
      'Recibo de doação e informe anual para o imposto de renda do contribuinte',
      'Prestação de contas mensal de cada campus para a sede',
    ],
    integracoes: [
      { com: 'contabilidade', como: 'Cada entrada e saída já nasce com a conta contábil: o lançamento é automático' },
      { com: 'membros', como: 'Contribuições ligadas ao cadastro do membro, para recibo e informe' },
    ],
    ganhoContador: 'Recebe o movimento já classificado e conciliado, em vez de caixas de comprovantes.',
  },
  {
    id: 'contabilidade',
    nome: 'Contabilidade',
    resumo: 'A contabilidade da igreja feita a partir do que a tesouraria e o patrimônio já registram.',
    paraQuem: 'Escritório contábil parceiro e administração da igreja',
    situacao: 'previa',
    ordem: 2,
    funcionalidades: [
      'Plano de contas próprio para entidades religiosas (ITG 2002)',
      'Lançamentos gerados pela tesouraria e pelo patrimônio, com revisão do contador',
      'Depreciação mensal dos bens',
      'Balancete, demonstração do superávit ou déficit e balanço',
      'Fechamento do mês com lista de pendências por campus',
      'Portal do contador: um acesso para acompanhar todas as igrejas clientes',
    ],
    integracoes: [
      { com: 'tesouraria', como: 'Pendências do fechamento voltam para o tesoureiro do campus resolver' },
      { com: 'pessoal', como: 'Folha e encargos lançados automaticamente' },
    ],
    ganhoContador: 'Menos digitação e mais análise: o escritório atende mais igrejas com a mesma equipe.',
  },
  {
    id: 'pessoal',
    nome: 'Pessoal e Obrigações',
    resumo: 'Pastores, funcionários e voluntários com documentos em dia e o calendário de obrigações da igreja.',
    paraQuem: 'Administração da igreja e departamento pessoal do escritório',
    situacao: 'previa',
    ordem: 3,
    funcionalidades: [
      'Cadastro de pastores (prebenda), funcionários e voluntários',
      'Termo de voluntariado assinado e guardado',
      'Recibos e holerites',
      'Calendário de obrigações: eSocial, EFD-Reinf, DCTFWeb, ECD e ECF',
      'Vencimento de certidões, alvarás e laudos com aviso antecipado',
    ],
    integracoes: [
      { com: 'tesouraria', como: 'Pagamentos da folha entram nas contas a pagar' },
      { com: 'contabilidade', como: 'Folha, encargos e provisões lançados no fechamento' },
    ],
    ganhoContador: 'Documentos e prazos na mão sem cobrar a igreja por e-mail.',
  },
  {
    id: 'membros',
    nome: 'Secretaria e Membros',
    resumo: 'Cadastro de membros e famílias, da chegada à transferência, com consentimento da LGPD.',
    paraQuem: 'Secretaria da igreja e pastores de campus',
    situacao: 'previa',
    ordem: 4,
    funcionalidades: [
      'Membros e famílias por campus',
      'Batismo, ingresso, transferência e cartas',
      'Aniversariantes da semana',
      'Células e pequenos grupos',
      'Consentimento de uso de dados (LGPD) registrado',
    ],
    integracoes: [
      { com: 'tesouraria', como: 'Contribuinte identificado para recibo e informe anual' },
      { com: 'ministerios', como: 'Membros disponíveis para as escalas' },
    ],
    ganhoContador: 'Base confiável de contribuintes para os recibos de doação.',
  },
  {
    id: 'ministerios',
    nome: 'Ministérios e Escalas',
    resumo: 'Escalas de mídia, louvor e recepção montadas em minutos, com confirmação dos voluntários.',
    paraQuem: 'Líderes de ministério e voluntários',
    situacao: 'previa',
    ordem: 5,
    funcionalidades: [
      'Ministérios e equipes por campus',
      'Escala por culto com confirmação do voluntário',
      'Troca de escala entre voluntários',
      'Eventos com inscrição e check-in',
      'Equipamentos reservados para cada culto ou evento',
    ],
    integracoes: [
      { com: 'patrimonio', como: 'Reserva os equipamentos e avisa se algum está em manutenção' },
      { com: 'membros', como: 'Escala só com membros ativos do campus' },
    ],
    ganhoContador: 'Voluntariado documentado, sem risco trabalhista.',
  },
]

export const SITUACAO_MODULO_LABELS: Record<SituacaoModulo, string> = {
  no_ar: 'No ar',
  previa: 'Prévia',
}

export function buscarModulo(id: string) {
  return MODULOS.find(m => m.id === id) ?? null
}
