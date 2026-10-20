// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { headers } from 'next/headers'
import { Suspense } from 'react'
import { Figtree, IBM_Plex_Mono, Sora } from 'next/font/google'
import Sidebar from '@/components/Sidebar'
import Interacoes from '@/components/Interacoes'
import { redirect } from 'next/navigation'
import { dadosDaIgreja, exigirLogin } from '@/lib/auth'
import { moduloDaRota } from '@/lib/modulos'
import { situacaoFinanceira } from '@/lib/assinaturas'
import AvisoPagamento from '@/components/AvisoPagamento'

// Fontes da identidade Genesis41: Sora nos títulos, Figtree no texto e IBM Plex Mono nos números
const titulo = Sora({ subsets: ['latin'], weight: ['600', '700'], variable: '--fonte-titulo' })
const texto = Figtree({ subsets: ['latin'], variable: '--fonte-texto' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '600'], variable: '--fonte-mono' })

export const metadata: Metadata = {
  title: 'ILAN - Sistema de Inventário de Mídia',
  description: 'Gerenciamento de equipamentos e manutenção de mídia para igrejas ILAN',
  // Nome e ícone quando o sistema é instalado na tela de início do iPhone
  appleWebApp: { capable: true, title: 'Inventário ILAN', statusBarStyle: 'black' },
  icons: { icon: '/icone-192.png', apple: '/apple-touch-icon.png' },
}

export const viewport: Viewport = {
  themeColor: '#11141A',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // O middleware já barra quem não tem sessão; aqui também barra quem foi desativado depois de entrar
  const caminho = headers().get('x-pathname') ?? ''
  // Telas públicas: login e o link de convite do administrador da igreja
  const publica = caminho === '/login' || caminho.startsWith('/convite/')
  let aviso: React.ReactNode = null
  if (!publica) {
    const usuario = await exigirLogin({ permitirSuperadmin: true })
    // Tela de um módulo que a igreja não tem liberado: volta para o início
    const modulo = moduloDaRota(caminho)
    if (usuario && !usuario.superadmin && modulo && !(await dadosDaIgreja()).modulos.includes(modulo.id)) redirect('/inicio')
    // Pagamento atrasado: o administrador da igreja é avisado antes do bloqueio
    if (usuario?.role === 'admin' && usuario.igreja_id) {
      const financeiro = await situacaoFinanceira(usuario.igreja_id)
      if (financeiro.atrasoDesde && !financeiro.bloqueada) aviso = <AvisoPagamento situacao={financeiro} />
    }
  }

  return (
    <html lang="pt-BR" className={`${titulo.variable} ${texto.variable} ${mono.variable}`}>
      <body>
        <Suspense>
          <Interacoes />
        </Suspense>
        <div className="flex flex-col md:flex-row min-h-screen">
          <Sidebar />
          {/* min-w-0 deixa tabelas largas rolarem dentro da página em vez de cortar a tela */}
          <main className="flex-1 min-w-0 bg-gray-50">
            {aviso}
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
