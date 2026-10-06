// middleware.ts
// Login temporariamente desligado: todas as rotas ficam abertas para teste.
// A página inicial e a tela de login (/auth) vão direto para o dashboard.
// Para religar, restaure a verificação de sessão (ver histórico do git).

import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/' || pathname === '/auth') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/auth'],
}
