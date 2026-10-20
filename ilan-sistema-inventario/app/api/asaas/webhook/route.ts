// app/api/asaas/webhook/route.ts
// Avisos do Asaas sobre as faturas das igrejas (paga, vencida, estornada, excluída).
// Configure no Asaas: Integrações > Webhooks, URL https://<domínio>/api/asaas/webhook,
// eventos de cobrança e o mesmo token da variável ASAAS_WEBHOOK_TOKEN.

import { timingSafeEqual } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { processarEvento } from '@/lib/assinaturas'

export const dynamic = 'force-dynamic'

function tokenValido(recebido: string | null) {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN
  if (!esperado || !recebido) return false
  const a = Buffer.from(recebido)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  if (!tokenValido(request.headers.get('asaas-access-token'))) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  let evento: Parameters<typeof processarEvento>[0]
  try {
    evento = await request.json()
  } catch {
    return NextResponse.json({ ok: false, erro: 'JSON inválido' }, { status: 400 })
  }
  try {
    const resultado = await processarEvento(evento)
    return NextResponse.json({ ok: true, resultado })
  } catch (e) {
    // Resposta fora de 2xx: o Asaas tenta de novo depois
    process.stderr.write(`asaas webhook: ${e instanceof Error ? e.message : String(e)}\n`)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
