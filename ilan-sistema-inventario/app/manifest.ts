import type { MetadataRoute } from 'next'
import { NOME, SLOGAN } from '@/lib/marca'

// Permite instalar o sistema como aplicativo no celular (Chrome no Android, Safari no iPhone)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NOME,
    short_name: NOME,
    description: SLOGAN,
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#11141A',
    theme_color: '#11141A',
    lang: 'pt-BR',
    icons: [
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
