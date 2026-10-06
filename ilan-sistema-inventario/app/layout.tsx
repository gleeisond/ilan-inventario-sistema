// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { headers } from 'next/headers'
import Sidebar from '@/components/Sidebar'
import { exigirLogin } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'ILAN - Sistema de Inventário de Mídia',
  description: 'Gerenciamento de equipamentos e manutenção de mídia para igrejas ILAN',
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
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 bg-gray-50">{children}</main>
        </div>
      </body>
    </html>
  )
}
