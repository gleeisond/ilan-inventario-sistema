// app/api/manter-ativo/route.ts
// Chamada todo dia pelo Vercel Cron (vercel.json). Faz uma leitura real no banco
// para o Supabase do plano gratuito não pausar o projeto por falta de uso.

import { NextResponse, type NextRequest } from 'next/server'
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // A Vercel manda "Bearer <CRON_SECRET>" quando a variável existe; sem ela, a rota fica aberta
  // (só lê um id, não expõe dados)
  const segredo = process.env.CRON_SECRET
  if (segredo && request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  // service_role ignora o RLS; sem ela (preview), tenta com a chave pública
  const cliente = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : getSupabase()
  const { error } = await cliente.from('campus').select('id').limit(1)

  if (error) {
    process.stderr.write(`manter-ativo: ${error.message}\n`)
    return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, em: new Date().toISOString() })
}
