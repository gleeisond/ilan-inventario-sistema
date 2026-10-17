'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// No celular o menu fica escondido atrás do botão ☰ e desliza da esquerda; no computador fica fixo na lateral
export default function MenuLateral({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false)
  const caminho = usePathname()

  // Fecha ao trocar de tela
  useEffect(() => setAberto(false), [caminho])

  // Esc fecha; com o menu aberto a página de trás não rola
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('keydown', aoTeclar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
    }
  }, [aberto])

  // Quem é desativado e mandado ao login durante a navegação chega sem recarregar a página; o menu some igual
  if (caminho === '/login') return null

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-gray-900 px-4 py-3">
        <img src="/logo-ilan.png" alt="Ilan Church" className="h-7 w-auto" />
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
          className="p-2 -mr-2 text-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      <div
        onClick={() => setAberto(false)}
        aria-hidden="true"
        className={`md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          aberto ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        data-aberto={aberto}
        className={`menu-lateral fixed md:sticky inset-y-0 left-0 md:top-0 z-50 md:h-screen w-64 shrink-0 flex flex-col overflow-y-auto bg-gray-900 p-6 text-white md:translate-x-0 ${
          aberto ? 'translate-x-0' : '-translate-x-full invisible md:visible'
        }`}
      >
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar menu"
          className="md:hidden self-end -mt-2 -mr-2 mb-2 p-2 text-gray-300 hover:text-white hover:rotate-90"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {children}
      </aside>
    </>
  )
}
