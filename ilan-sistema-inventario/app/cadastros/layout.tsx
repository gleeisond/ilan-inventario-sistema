import Abas from '@/components/Abas'
import { exigirAdmin } from '@/lib/auth'

const ABAS = [
  { href: '/cadastros/campus', rotulo: 'Campus' },
  { href: '/cadastros/categorias', rotulo: 'Categorias' },
  { href: '/cadastros/locais', rotulo: 'Locais' },
]

export default async function LayoutCadastros({ children }: { children: React.ReactNode }) {
  await exigirAdmin()

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cadastros</h1>
        <p className="text-gray-600 mt-1">Campus, categorias e locais usados no inventário</p>
      </div>
      <Abas abas={ABAS} />
      {children}
    </div>
  )
}
