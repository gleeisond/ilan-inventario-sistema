import Link from 'next/link'
import { MODULOS, SITUACAO_MODULO_LABELS } from '@/lib/modulos'

// Vitrine dos módulos: o que já está no ar e o que vem a seguir, na ordem sugerida de construção
export default function Modulos() {
  const ordenados = [...MODULOS].sort((a, b) => a.ordem - b.ordem)
  const nome = (id: string) => MODULOS.find(m => m.id === id)?.nome ?? id

  return (
    <div className="space-y-10">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-bold">Do patrimônio à contabilidade</h1>
        <p className="text-gray-600">
          O patrimônio já está no ar. Os próximos módulos usam a mesma base (igrejas, filiais, usuários e permissões) e conversam entre si:
          o que a igreja registra no dia a dia chega pronto para o contador.
        </p>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 cascata">
        {ordenados.map(m => {
          const noAr = m.situacao === 'no_ar'
          return (
            <li key={m.id}>
              <Link
                href={noAr ? '/dashboard' : `/plataforma/modulos/${m.id}`}
                className={`cartao flex h-full flex-col rounded-lg border p-5 ${noAr ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`font-mono text-sm ${noAr ? 'text-ouro-400' : 'text-ouro-600'}`}>{String(m.ordem).padStart(2, '0')}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${noAr ? 'bg-ouro-400 text-gray-900' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {SITUACAO_MODULO_LABELS[m.situacao]}
                  </span>
                </div>
                <h2 className={`mt-3 text-lg font-semibold ${noAr ? 'text-white' : 'text-gray-900'}`}>{m.nome}</h2>
                <p className={`mt-1 text-sm flex-1 ${noAr ? 'text-gray-300' : 'text-gray-600'}`}>{m.resumo}</p>
                <p className={`mt-4 text-sm font-medium ${noAr ? 'text-ouro-400' : 'text-ouro-700'}`}>
                  {noAr ? 'Abrir o sistema →' : 'Ver prévia →'}
                </p>
              </Link>
            </li>
          )
        })}
      </ol>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">Como os módulos conversam</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-5 py-3 font-semibold">De</th>
                <th className="px-5 py-3 font-semibold">Para</th>
                <th className="px-5 py-3 font-semibold">O que acontece</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ordenados.flatMap(m =>
                m.integracoes.map(i => (
                  <tr key={m.id + i.com}>
                    <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{m.nome}</td>
                    <td className="px-5 py-3 whitespace-nowrap">{nome(i.com)}</td>
                    <td className="px-5 py-3 text-gray-600">{i.como}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
