'use client'

import { useEffect, useState } from 'react'

// Excluir em dois toques: o primeiro transforma o botão em "Confirmar?",
// o segundo envia. Se a pessoa não confirmar em alguns segundos, ele volta ao normal.
export default function BotaoExcluir({ nome }: { nome: string }) {
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    if (!confirmando) return
    const volta = setTimeout(() => setConfirmando(false), 4000)
    return () => clearTimeout(volta)
  }, [confirmando])

  return (
    <button
      type="submit"
      data-confirmando={confirmando}
      aria-label={confirmando ? `Confirmar exclusão de ${nome}` : `Excluir ${nome}`}
      onClick={e => {
        if (!confirmando) {
          e.preventDefault()
          setConfirmando(true)
        }
      }}
      onBlur={() => setConfirmando(false)}
      className={`botao-excluir whitespace-nowrap ${confirmando ? '' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
    >
      {confirmando ? 'Confirmar?' : 'Excluir'}
    </button>
  )
}
