// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { headers } from 'next/headers'
import Sidebar from '@/components/Sidebar'
import { exigirLogin } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'ILAN - Sistema de Inventário de Mídia',
  description: 'Gerenciamento de equipamentos e manutenção de mídia para igrejas ILAN',
  // Nome e ícone quando o sistema é instalado na tela de início do iPhone
  appleWebApp: { capable: true, title: 'Inventário ILAN', statusBarStyle: 'black' },
  icons: { icon: '/icone-192.png', apple: '/apple-touch-icon.png' },
}

export const viewport: Viewport = {
  themeColor: '#111827',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // O middleware já barra quem não tem sessão; aqui também barra quem foi desativado depois de entrar
  if (headers().get('x-pathname') !== '/login') await exigirLogin()

  return (
    <html lang="pt-BR">
      <body>
        <div className="flex flex-col md:flex-row min-h-screen">
          <Sidebar />
          {/* min-w-0 deixa tabelas largas rolarem dentro da página em vez de cortar a tela */}
          <main className="flex-1 min-w-0 bg-gray-50">{children}</main>
        </div>
      </body>
    </html>
  )
}
