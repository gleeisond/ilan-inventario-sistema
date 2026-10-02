// middleware.ts
// Protege rotas e redireciona usuários não autenticados para login

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/auth', '/']

  // Se é rota pública, deixa passar
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Para qualquer outra rota, verifica autenticação
  try {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!)
    
    // Tenta pegar a sessão do cookie
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Se não tem sessão, redireciona para login
    if (!session) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }

    // Se tem sessão, deixa passar
    return NextResponse.next()
  } catch (error) {
    console.error('Erro no middleware:', error)
    // Em caso de erro, redireciona para login (seguro)
    return NextResponse.redirect(new URL('/auth', request.url))
  }
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
