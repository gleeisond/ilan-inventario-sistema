'use client'

import { useEffect, useState } from 'react'

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

// Registra o service worker e mostra como instalar o sistema no celular.
// Android/Chrome: botão "Instalar aplicativo". iPhone/Safari: instrução do menu Compartilhar.
export default function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null)
  const [iphone, setIphone] = useState(false)
  const [instalado, setInstalado] = useState(true)
  const [dicaAberta, setDicaAberta] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setInstalado(standalone)
    setIphone(/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

    const aoOferecer = (e: Event) => {
      e.preventDefault()
      setEvento(e as EventoInstalar)
    }
    const aoInstalar = () => {
      setEvento(null)
      setInstalado(true)
    }
    window.addEventListener('beforeinstallprompt', aoOferecer)
    window.addEventListener('appinstalled', aoInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', aoOferecer)
      window.removeEventListener('appinstalled', aoInstalar)
    }
  }, [])

  if (instalado) return null

  if (evento) {
    return (
      <button
        type="button"
        onClick={async () => {
          await evento.prompt()
          await evento.userChoice
          setEvento(null)
        }}
        className="block mt-3 text-gray-300 hover:text-white"
      >
        Instalar aplicativo
      </button>
    )
  }

  if (iphone) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setDicaAberta(!dicaAberta)}
          aria-expanded={dicaAberta}
          className="inline-flex items-center gap-1 text-gray-300 hover:text-white"
        >
          Instalar aplicativo
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={`transition-transform duration-300 ${dicaAberta ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div className="expansivel" data-aberto={dicaAberta}>
          <div>
            <p className="pt-2 text-gray-400 leading-snug">
              No Safari, toque em <strong className="text-gray-200">Compartilhar</strong> (o quadrado com a seta para cima) e
              depois em <strong className="text-gray-200">Adicionar à Tela de Início</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
