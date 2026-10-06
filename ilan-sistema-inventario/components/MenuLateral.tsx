'use client'

import { useState } from 'react'

// No celular o menu fica escondido atrás do botão ☰; no computador fica fixo na lateral
export default function MenuLateral({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-gray-900 px-4 py-3">
        <img src="/logo-ilan.png" alt="Ilan Church" className="h-7 w-auto" />
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          className="p-2 -mr-2 text-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {aberto && <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setAberto(false)} />}

      <aside
        className={`${aberto ? 'flex' : 'hidden'} md:flex fixed md:sticky inset-y-0 left-0 md:top-0 z-50 md:h-screen w-64 shrink-0 flex-col overflow-y-auto bg-gray-900 p-6 text-white`}
      >
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar menu"
          className="md:hidden self-end -mt-2 -mr-2 mb-2 p-2 text-gray-300"
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
