import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MODULOS, buscarModulo } from '@/lib/modulos'
import { PREVIAS } from '@/components/modulos/previas'

export const dynamic = 'force-dynamic'

export default function DetalheModulo({ params }: { params: { id: string } }) {
  const modulo = buscarModulo(params.id)
  const Previa = modulo ? PREVIAS[modulo.id] : undefined
  if (!modulo || !Previa) notFound()
  const nome = (id: string) => MODULOS.find(m => m.id === id)?.nome ?? id

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link href="/plataforma/modulos" className="text-sm text-ouro-600 hover:text-ouro-700">
          ← Todos os módulos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{modulo.nome}</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Prévia</span>
        </div>
        <p className="max-w-3xl text-gray-600">{modulo.resumo}</p>
        <p className="text-sm text-gray-500">Para: {modulo.paraQuem}</p>
      </div>

      {/* Moldura de tela para deixar claro que é uma demonstração */}
      <div className="rounded-xl border border-gray-300 bg-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-900 px-4 py-2">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-600" />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-ouro-400">Prévia · dados de exemplo</p>
        </div>
        <div className="p-4 md:p-6">
          <Previa />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h2 className="font-semibold text-lg">O que o módulo faz</h2>
          <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
            {modulo.funcionalidades.map(f => (
              <li key={f} className="flex gap-3 px-4 py-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ouro-400" aria-hidden="true" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="font-semibold text-lg">Com os outros módulos</h2>
          <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
            {modulo.integracoes.map(i => (
              <li key={i.com} className="px-4 py-2.5">
                <p className="font-medium text-gray-900">{nome(i.com)}</p>
                <p className="text-gray-600">{i.como}</p>
              </li>
            ))}
          </ul>
          <div className="rounded-lg bg-gray-900 p-4 text-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-ouro-400">Para o escritório contábil</p>
            <p className="mt-1 text-gray-100">{modulo.ganhoContador}</p>
          </div>
        </section>
      </div>
    </div>
  )
}
