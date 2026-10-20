import Link from 'next/link'
import { dadosDaIgreja, exigirLogin } from '@/lib/auth'
import { MODULOS } from '@/lib/modulos'

export const dynamic = 'force-dynamic'

// Primeira tela da igreja: os módulos que ela tem liberados
export default async function Inicio() {
  await exigirLogin()
  const igreja = await dadosDaIgreja()
  const liberados = MODULOS.filter(m => igreja.modulos.includes(m.id))

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{igreja.nome}</h1>
        <p className="text-gray-600 mt-1">Módulos liberados para a sua igreja</p>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 cascata">
        {liberados.map(m => {
          const noAr = m.situacao === 'no_ar' && m.rotas.length > 0
          const conteudo = (
            <>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">{m.nome}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${noAr ? 'bg-ouro-100 text-ouro-800' : 'bg-gray-100 text-gray-700'}`}>
                  {noAr ? 'Disponível' : 'Em implantação'}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{m.resumo}</p>
              {noAr && <p className="mt-4 text-sm font-medium text-ouro-700">Abrir →</p>}
            </>
          )
          return (
            <li key={m.id}>
              {noAr ? (
                <Link href={m.rotas[0]} className="cartao block h-full rounded-lg border border-gray-200 bg-white p-5">
                  {conteudo}
                </Link>
              ) : (
                <div className="h-full rounded-lg border border-gray-200 bg-white p-5">{conteudo}</div>
              )}
            </li>
          )
        })}
      </ul>
      {liberados.length === 0 && <p className="text-gray-500">Nenhum módulo liberado ainda. Fale com a Genesis41.</p>}
    </div>
  )
}
