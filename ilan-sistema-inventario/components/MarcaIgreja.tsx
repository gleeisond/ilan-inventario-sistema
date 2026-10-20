import type { IgrejaDoContexto } from '@/lib/auth'

// Logo da igreja no menu. Sem logo cadastrada, mostra o nome com a cor da igreja.
export default function MarcaIgreja({ igreja, grande = false }: { igreja: IgrejaDoContexto; grande?: boolean }) {
  if (igreja.logo_url) {
    return <img src={igreja.logo_url} alt={igreja.nome} className={grande ? 'w-full max-w-[200px]' : 'h-7 w-auto'} />
  }
  return (
    <span className={`flex items-center gap-2 font-titulo font-bold text-white ${grande ? 'text-lg leading-tight' : 'text-base'}`}>
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: igreja.cor_principal }} aria-hidden="true" />
      {igreja.nome}
    </span>
  )
}
