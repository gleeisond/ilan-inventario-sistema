// middleware.ts
// Com LOGIN_ATIVO=1, toda página exige sessão válida (exceto /login).
// Sem a variável, o sistema continua aberto, para o admin cadastrar as senhas antes de fechar.

import { type NextRequest, NextResponse } from 'next/server'
import { COOKIE_SESSAO, lerToken, loginAtivo } from '@/lib/sessao'

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === '/') return NextResponse.redirect(new URL('/dashboard', request.url))
  if (pathname === '/auth') return NextResponse.redirect(new URL('/login', request.url))

  if (loginAtivo() && pathname !== '/login') {
    const sessao = await lerToken(request.cookies.get(COOKIE_SESSAO)?.value)
    if (!sessao) {
      const destino = new URL('/login', request.url)
      destino.searchParams.set('voltar', pathname + search)
      return NextResponse.redirect(destino)
    }
  }

  // Repassa o caminho para o layout saber quando está na tela de login
  const headers = new Headers(request.headers)
  headers.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  // Arquivos de public/ (logo, ícones) e os do aplicativo instalável ficam fora,
  // para funcionarem também antes do login
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\.png$).*)'],
}
