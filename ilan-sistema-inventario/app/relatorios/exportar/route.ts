import { NextRequest } from 'next/server'
import { exigirLogin, registrarLog } from '@/lib/auth'
import { STATUS_LABELS } from '@/lib/equipamentos'
import { MANUTENCAO_STATUS_LABELS, PRIORIDADE_LABELS } from '@/lib/manutencoes'
import { buscarEquipamentos, buscarManutencoes, diasParaResolver, periodoPadrao } from '@/lib/relatorios'

export const dynamic = 'force-dynamic'

// CSV no padrão do Excel em português: separador ";", vírgula decimal e BOM para os acentos
function celula(valor: string | number | null | undefined) {
  if (valor === null || valor === undefined) return ''
  const texto = typeof valor === 'number' ? valor.toFixed(2).replace('.', ',') : valor
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

function csv(cabecalho: string[], linhas: (string | number | null | undefined)[][]) {
  return '﻿' + [cabecalho, ...linhas].map(l => l.map(celula).join(';')).join('\r\n')
}

function dataBR(data: string | null) {
  if (!data) return ''
  const [a, m, d] = data.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

export async function GET(req: NextRequest) {
  await exigirLogin()
  const p = req.nextUrl.searchParams
  const filtros = { campus: p.get('campus') ?? undefined, de: p.get('de') ?? undefined, ate: p.get('ate') ?? undefined }
  const tipo = p.get('tipo') === 'manutencoes' ? 'manutencoes' : 'equipamentos'

  let conteudo: string
  let nome: string
  if (tipo === 'equipamentos') {
    const { equipamentos, error } = await buscarEquipamentos(filtros)
    if (error) return new Response(`Erro ao gerar a planilha: ${error.message}`, { status: 500 })
    conteudo = csv(
      ['Equipamento', 'Marca', 'Categoria', 'Campus', 'Local', 'Responsável', 'Situação', 'Valor (R$)', 'Data de compra'],
      equipamentos.map(e => [
        e.name, e.brand, e.category, e.campus?.name, e.location, e.responsible?.name,
        STATUS_LABELS[e.status], e.value === null ? null : Number(e.value), dataBR(e.purchase_date),
      ])
    )
    nome = 'equipamentos'
  } else {
    const { manutencoes, error } = await buscarManutencoes(filtros)
    if (error) return new Response(`Erro ao gerar a planilha: ${error.message}`, { status: 500 })
    conteudo = csv(
      ['Aberto em', 'Equipamento', 'Campus', 'Problema', 'Prioridade', 'Status', 'Aberto por', 'Previsão', 'Entregue em', 'Dias para resolver', 'Custo (R$)'],
      manutencoes.map(m => [
        dataBR(m.created_at), m.equipment?.name, m.campus?.name, m.problem_description, PRIORIDADE_LABELS[m.priority],
        MANUTENCAO_STATUS_LABELS[m.status], m.created_by?.name, dataBR(m.scheduled_completion_date),
        dataBR(m.actual_completion_date), diasParaResolver(m)?.toString() ?? '', m.cost === null ? null : Number(m.cost),
      ])
    )
    const { de, ate } = periodoPadrao(filtros)
    nome = `manutencoes_${de}_a_${ate}`
  }

  await registrarLog({ acao: 'relatorio_exportado', descricao: `Exportou a planilha de ${tipo === 'equipamentos' ? 'equipamentos' : 'manutenções'}` })
  return new Response(conteudo, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nome}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
