'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Item = { href: string; rotulo: string }
type Posicao = { top: number; height: number }

// Links do menu lateral. Uma pílula desliza até a tela atual e outra, mais clara, segue o mouse.
export default function NavMenu({ itens }: { itens: Item[] }) {
  const caminho = usePathname()
  const links = useRef<(HTMLAnchorElement | null)[]>([])
  const [sobre, setSobre] = useState<number | null>(null)
  const [posAtivo, setPosAtivo] = useState<Posicao | null>(null)
  // Na primeira medida o destaque aparece direto no lugar; depois disso, desliza
  const [animar, setAnimar] = useState(false)
  const [posSobre, setPosSobre] = useState<Posicao | null>(null)

  const ativo = itens.findIndex(i => caminho === i.href || caminho.startsWith(i.href + '/'))

  const medir = (i: number): Posicao | null => {
    const el = links.current[i]
    return el ? { top: el.offsetTop, height: el.offsetHeight } : null
  }

  useEffect(() => {
    setPosAtivo(ativo >= 0 ? medir(ativo) : null)
    const liga = setTimeout(() => setAnimar(true), 50)
    return () => clearTimeout(liga)
  }, [ativo])

  useEffect(() => {
    if (sobre !== null) setPosSobre(medir(sobre))
  }, [sobre])

  return (
    <nav className="relative space-y-1" onMouseLeave={() => setSobre(null)}>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 rounded-lg bg-white/5"
        style={{
          top: posSobre?.top ?? 0,
          height: posSobre?.height ?? 0,
          opacity: sobre !== null && sobre !== ativo ? 1 : 0,
          transition: 'top 0.35s var(--suave), height 0.35s var(--suave), opacity 0.2s ease',
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 rounded-lg bg-white/10"
        style={{
          top: posAtivo?.top ?? 0,
          height: posAtivo?.height ?? 0,
          opacity: posAtivo ? 1 : 0,
          transition: animar ? 'top 0.45s var(--suave), height 0.45s var(--suave), opacity 0.3s ease' : 'none',
        }}
      >
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-full bg-indigo-400" />
      </span>
      {itens.map((item, i) => (
        <Link
          key={item.href}
          href={item.href}
          ref={el => {
            links.current[i] = el
          }}
          onMouseEnter={() => setSobre(i)}
          aria-current={i === ativo ? 'page' : undefined}
          className={`relative block rounded-lg px-3 py-2 transition-colors duration-200 ${
            i === ativo ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'
          }`}
        >
          {item.rotulo}
        </Link>
      ))}
    </nav>
  )
}
