// middleware.ts
// Protege rotas verificando sessão via cookie (Edge Runtime seguro)

import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/auth', '/']

  // Se é rota pública, deixa passar
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Verifica se tem token de autenticação nos cookies
  const authToken = request.cookies.get('sb-auth-token')?.value || 
                    request.cookies.get('sb-refresh-token')?.value

  // Se não tem token, redireciona para login
  if (!authToken) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Se tem token, deixa passar
  return NextResponse.next()
}

// Configurar quais rotas o middleware deve rodar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}