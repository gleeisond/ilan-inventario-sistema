// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Genesis41 · Patrimônio',
  description: 'Gestão de patrimônio e manutenção de equipamentos para igrejas',
  icons: { icon: '/marca/genesis41-favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
