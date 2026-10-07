'use client'

import { useState } from 'react'
import type { AcaoFluxo } from '@/lib/fluxoReparo'

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none'

const ESTILOS: Record<AcaoFluxo['estilo'], string> = {
  principal: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  secundario: 'bg-gray-900 hover:bg-gray-700 text-white',
  perigo: 'bg-red-600 hover:bg-red-700 text-white',
}

// Escolhe uma das ações da etapa atual; os campos obrigatórios aparecem conforme a ação
export default function EtapaReparo({
  chamadoId,
  status,
  acoes,
  pessoas,
  custoAtual,
  enviar,
}: {
  chamadoId: string
  status: string
  acoes: AcaoFluxo[]
  pessoas: { id: string; name: string }[] | null // só com o login desligado
  custoAtual: string
  enviar: (form: FormData) => Promise<void>
}) {
  const [escolhida, setEscolhida] = useState(acoes[0]?.id)
  const acao = acoes.find(a => a.id === escolhida) ?? acoes[0]
  if (!acao) return null

  return (
    <form action={enviar} className="space-y-3">
      <input type="hidden" name="id" value={chamadoId} />
      <input type="hidden" name="de" value={status} />
      <input type="hidden" name="acao" value={acao.id} />

      {acoes.length > 1 && (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="O que aconteceu">
          {acoes.map(a => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={a.id === acao.id}
              onClick={() => setEscolhida(a.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                a.id === acao.id ? 'border-indigo-600 bg-indigo-50 text-indigo-800 font-medium' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
      )}

      {acao.exigeCusto && (
        <label className="block text-sm font-medium text-gray-700">
          <span className="block mb-1">Valor do orçamento (R$) *</span>
          <input key={acao.id} name="cost" inputMode="decimal" required placeholder="Ex: 350,00" defaultValue={custoAtual} className={inputClass} />
        </label>
      )}

      <label className="block text-sm font-medium text-gray-700">
        <span className="block mb-1">{acao.exigeComentario ? `${acao.exigeComentario} *` : 'Comentário (opcional)'}</span>
        <textarea key={acao.id} name="comentario" rows={2} required={Boolean(acao.exigeComentario)} className={inputClass} />
      </label>

      {pessoas && (
        <label className="block text-sm font-medium text-gray-700">
          <span className="block mb-1">Quem está registrando *</span>
          <select name="performed_by_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>Selecione</option>
            {pessoas.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      )}

      <button type="submit" className={`w-full font-semibold px-4 py-2 rounded-lg transition ${ESTILOS[acao.estilo]}`}>
        {acao.rotulo}
      </button>
    </form>
  )
}
