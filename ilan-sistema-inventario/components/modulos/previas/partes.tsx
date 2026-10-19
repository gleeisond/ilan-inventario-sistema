// Peças comuns das prévias dos módulos (só visual, com dados de exemplo)

export function moeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function Kpis({ itens }: { itens: { titulo: string; valor: string; detalhe?: string; destaque?: string }[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 cascata">
      {itens.map(k => (
        <div key={k.titulo} className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600">{k.titulo}</p>
          <p className={`text-2xl font-bold mt-1 font-titulo ${k.destaque ?? 'text-gray-900'}`}>{k.valor}</p>
          {k.detalhe && <p className="text-xs text-gray-500 mt-1">{k.detalhe}</p>}
        </div>
      ))}
    </div>
  )
}

export function Painel({ titulo, acao, children }: { titulo: string; acao?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-sm">{titulo}</h3>
        {acao && <span className="text-xs font-medium text-ouro-700">{acao}</span>}
      </div>
      {children}
    </div>
  )
}

export function Selo({ texto, cor }: { texto: string; cor: string }) {
  return <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium ${cor}`}>{texto}</span>
}

// Barras horizontais simples para comparar valores
export function Barras({ itens, formatar = moeda }: { itens: { rotulo: string; valor: number }[]; formatar?: (v: number) => string }) {
  const maior = Math.max(...itens.map(i => i.valor), 1)
  return (
    <ul className="p-4 space-y-3">
      {itens.map(i => (
        <li key={i.rotulo} className="text-sm">
          <div className="flex justify-between gap-3 mb-1">
            <span className="text-gray-700">{i.rotulo}</span>
            <span className="font-mono text-gray-900">{formatar(i.valor)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div className="barra h-2 rounded-full bg-ouro-400" style={{ width: `${(i.valor / maior) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
