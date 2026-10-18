'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Aba = { href: string; rotulo: string }

// Abas com um sublinhado que desliza até a aba escolhida
export default function Abas({ abas }: { abas: Aba[] }) {
  const caminho = usePathname()
  const links = useRef<(HTMLAnchorElement | null)[]>([])
  const [linha, setLinha] = useState<{ left: number; width: number } | null>(null)
  // Na primeira medida o destaque aparece direto no lugar; depois disso, desliza
  const [animar, setAnimar] = useState(false)
  const ativa = abas.findIndex(a => caminho.startsWith(a.href))

  useEffect(() => {
    const el = links.current[ativa]
    setLinha(el ? { left: el.offsetLeft, width: el.offsetWidth } : null)
    const liga = setTimeout(() => setAnimar(true), 50)
    return () => clearTimeout(liga)
  }, [ativa])

  return (
    <nav className="relative flex gap-2 border-b border-gray-200 overflow-x-auto">
      {abas.map((aba, i) => (
        <Link
          key={aba.href}
          href={aba.href}
          ref={el => {
            links.current[i] = el
          }}
          aria-current={i === ativa ? 'page' : undefined}
          className={`px-4 py-2 font-medium whitespace-nowrap transition-colors duration-200 ${
            i === ativa ? 'text-indigo-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {aba.rotulo}
        </Link>
      ))}
      <span
        aria-hidden="true"
        className="absolute bottom-0 h-0.5 rounded-full bg-indigo-600"
        style={{
          left: linha?.left ?? 0,
          width: linha?.width ?? 0,
          opacity: linha ? 1 : 0,
          transition: animar ? 'left 0.45s var(--suave), width 0.45s var(--suave), opacity 0.2s ease' : 'none',
        }}
      />
    </nav>
  )
}
