import type { MetadataRoute } from 'next'

// Permite instalar o sistema como aplicativo no celular (Chrome no Android, Safari no iPhone)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Inventário ILAN',
    short_name: 'Inventário ILAN',
    description: 'Equipamentos e manutenções de mídia da ILAN',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#111827',
    theme_color: '#111827',
    lang: 'pt-BR',
    icons: [
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
