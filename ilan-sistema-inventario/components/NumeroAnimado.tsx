'use client'

import { useEffect, useRef, useState } from 'react'

// Número que conta de 0 até o valor quando aparece na tela
export default function NumeroAnimado({ valor, formato }: { valor: number; formato?: 'moeda' }) {
  const [atual, setAtual] = useState(valor)
  const iniciou = useRef(false)

  useEffect(() => {
    if (iniciou.current) {
      setAtual(valor)
      return
    }
    iniciou.current = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || valor === 0) return

    const duracao = 900
    const inicio = performance.now()
    let quadro = 0
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracao)
      const suave = 1 - Math.pow(1 - t, 4)
      setAtual(valor * suave)
      if (t < 1) quadro = requestAnimationFrame(passo)
    }
    setAtual(0)
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [valor])

  const texto =
    formato === 'moeda'
      ? atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : Math.round(atual).toLocaleString('pt-BR')

  return <span className="tabular-nums">{texto}</span>
}
