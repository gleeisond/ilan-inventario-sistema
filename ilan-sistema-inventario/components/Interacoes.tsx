'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

// Comportamentos globais de interação:
// - barra de progresso no topo enquanto a próxima tela carrega;
// - botão de enviar com indicador girando enquanto o formulário é processado.
export default function Interacoes() {
  const caminho = usePathname()
  const busca = useSearchParams()
  const [progresso, setProgresso] = useState<number | null>(null)
  const avanco = useRef<ReturnType<typeof setInterval>>()

  function iniciar() {
    clearInterval(avanco.current)
    setProgresso(8)
    // Avança cada vez mais devagar, sem nunca chegar ao fim antes da página responder
    avanco.current = setInterval(() => setProgresso(p => (p === null ? null : p + (90 - p) * 0.08)), 120)
  }

  function concluir() {
    clearInterval(avanco.current)
    document.querySelectorAll('button[data-enviando]').forEach(b => b.removeAttribute('data-enviando'))
    setProgresso(p => (p === null ? null : 100))
    setTimeout(() => setProgresso(p => (p === 100 ? null : p)), 350)
  }

  // A tela mudou: completa a barra e libera os botões
  useEffect(concluir, [caminho, busca])

  useEffect(() => {
    const aoClicar = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as HTMLElement).closest('a')
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return
      const destino = new URL(link.href, location.href)
      if (destino.origin !== location.origin || destino.pathname.startsWith('/relatorios/exportar')) return
      if (destino.pathname === location.pathname && destino.search === location.search) return
      iniciar()
    }
    // Quando a resposta do servidor redesenha a página no mesmo endereço (ex.: o mesmo erro de novo),
    // o endereço não muda; então também conclui quando o conteúdo da página é trocado
    let formEnviado: EventTarget | null = null
    const observador = new MutationObserver(registros => {
      // Ao enviar, o React põe e tira um campo temporário dentro do próprio formulário; isso não é a resposta chegando
      const mudouDeVerdade = registros.some(r => r.target !== formEnviado)
      if (!mudouDeVerdade) return
      observador.disconnect()
      concluir()
    })
    let reserva: ReturnType<typeof setTimeout>
    const aoEnviar = (e: SubmitEvent) => {
      formEnviado = e.target
      const botao = e.submitter as HTMLButtonElement | null
      if (botao?.tagName === 'BUTTON') botao.setAttribute('data-enviando', '')
      iniciar()
      const principal = document.querySelector('main')
      if (principal) observador.observe(principal, { childList: true, subtree: true, characterData: true })
      clearTimeout(reserva)
      reserva = setTimeout(concluir, 10000)
    }
    // Captura: o Link do Next cancela o clique antes de o evento chegar ao document
    document.addEventListener('click', aoClicar, true)
    // Fase de captura: o React cancela o envio padrão dos formulários com action antes de chegar ao document
    document.addEventListener('submit', aoEnviar, true)
    return () => {
      observador.disconnect()
      clearTimeout(reserva)
      document.removeEventListener('click', aoClicar, true)
      document.removeEventListener('submit', aoEnviar, true)
    }
  }, [])

  if (progresso === null) return null
  return (
    <div
      className="barra-progresso"
      style={{
        width: '100%',
        transform: `scaleX(${progresso / 100})`,
        opacity: progresso >= 100 ? 0 : 1,
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease 0.1s',
      }}
    />
  )
}
