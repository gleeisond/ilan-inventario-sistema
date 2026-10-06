import Link from 'next/link'
import { headers } from 'next/headers'
import { exigirAdmin } from '@/lib/auth'

const ABAS = [
  { href: '/cadastros/campus', rotulo: 'Campus' },
  { href: '/cadastros/categorias', rotulo: 'Categorias' },
  { href: '/cadastros/locais', rotulo: 'Locais' },
]

export default async function LayoutCadastros({ children }: { children: React.ReactNode }) {
  await exigirAdmin()
  const caminho = headers().get('x-pathname') ?? ''

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cadastros</h1>
        <p className="text-gray-600 mt-1">Campus, categorias e locais usados no inventário</p>
      </div>
      <nav className="flex gap-2 border-b border-gray-200">
        {ABAS.map(aba => (
          <Link
            key={aba.href}
            href={aba.href}
            className={`px-4 py-2 -mb-px border-b-2 font-medium ${
              caminho.startsWith(aba.href) ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {aba.rotulo}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
