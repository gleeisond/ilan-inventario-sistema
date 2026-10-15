'use client'
// components/AppShell.tsx
// Estrutura das telas internas: menu lateral, barra do celular e aviso do modo demonstração.
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ProfileProvider, useProfile } from '@/lib/profile'
import { DEMO_MODE, signOut } from '@/lib/supabase'
import { resetDemo } from '@/lib/equipamentos/demo'
import { ROLE_LABEL } from '@/lib/equipamentos/labels'

const NAV = [
  { href: '/dashboard', label: 'Painel' },
  { href: '/equipamentos', label: 'Equipamentos' },
  { href: '/manutencoes', label: 'Manutenções' },
]

function Bits() {
  return (
    <span className="inline-flex gap-[3px]" aria-hidden="true">
      <i className="block h-2.5 w-2.5 rounded-[2px] bg-nevoa" />
      <i className="block h-2.5 w-2.5 rounded-[2px] bg-ouro" />
      <i className="block h-2.5 w-2.5 rounded-[2px] border border-nevoa" />
      <i className="block h-2.5 w-2.5 rounded-[2px] bg-ouro" />
      <i className="block h-2.5 w-2.5 rounded-[2px] border border-nevoa" />
      <i className="block h-2.5 w-2.5 rounded-[2px] border border-nevoa" />
      <i className="block h-2.5 w-2.5 rounded-[2px] bg-ouro" />
    </span>
  )
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1" aria-label="Menu principal">
      {NAV.map(item => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-2 text-sm transition ${
              active ? 'bg-white/10 text-white shadow-[inset_2px_0_0_#E0AE4E]' : 'text-[#C9CBD1] hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function UserBox() {
  const profile = useProfile()
  const router = useRouter()
  return (
    <div className="border-t border-white/10 pt-4 text-sm">
      <p className="font-semibold text-nevoa">{profile.name}</p>
      <p className="text-xs text-[#A3A6AE]">{ROLE_LABEL[profile.role]}</p>
      {!DEMO_MODE && (
        <button
          type="button"
          onClick={async () => {
            await signOut()
            router.replace('/auth')
          }}
          className="mt-3 text-xs text-[#C9CBD1] underline-offset-2 hover:text-white hover:underline"
        >
          Sair
        </button>
      )}
    </div>
  )
}

function DemoBanner() {
  const [confirming, setConfirming] = useState(false)
  if (!DEMO_MODE) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAD9AE] bg-[#FBF3DF] px-4 py-2 text-xs text-[#6B4C0B] md:px-8">
      <span>
        <strong className="font-semibold">Modo demonstração.</strong> Dados de exemplo, salvos só neste navegador.
      </span>
      {confirming ? (
        <span className="flex items-center gap-3">
          Apagar o que foi cadastrado e voltar aos dados de exemplo?
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => {
              resetDemo()
              window.location.reload()
            }}
          >
            Restaurar
          </button>
          <button type="button" className="underline" onClick={() => setConfirming(false)}>
            Cancelar
          </button>
        </span>
      ) : (
        <button type="button" className="font-semibold underline" onClick={() => setConfirming(true)}>
          Restaurar dados de exemplo
        </button>
      )}
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <ProfileProvider>
      <div className="flex min-h-screen bg-papel">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between bg-grafite p-5 md:flex">
          <div className="flex flex-col gap-8">
            <Link href="/equipamentos" aria-label="Genesis41, início">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marca/genesis41-logo-horizontal-negativo.svg" alt="Genesis41" className="h-6 w-auto" />
            </Link>
            <Navigation />
          </div>
          <UserBox />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between bg-grafite px-4 py-3 md:hidden">
            <Link href="/equipamentos" aria-label="Genesis41, início">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marca/genesis41-logo-horizontal-negativo.svg" alt="Genesis41" className="h-5 w-auto" />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              aria-expanded={menuOpen}
              aria-controls="menu-celular"
              className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-nevoa"
            >
              {menuOpen ? 'Fechar' : 'Menu'}
            </button>
          </header>
          {menuOpen && (
            <div id="menu-celular" className="flex flex-col gap-4 bg-grafite px-4 pb-5 md:hidden">
              <Navigation onNavigate={() => setMenuOpen(false)} />
              <UserBox />
            </div>
          )}
          <DemoBanner />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
          <footer className="flex items-center gap-3 px-4 pb-6 text-xs text-cinza md:px-8">
            <span className="rounded bg-grafite p-1.5">
              <Bits />
            </span>
            Genesis41 · Patrimônio
          </footer>
        </div>
      </div>
    </ProfileProvider>
  )
}
