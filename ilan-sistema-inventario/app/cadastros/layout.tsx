import Abas from '@/components/Abas'
import { dadosDaIgreja, exigirAdmin } from '@/lib/auth'

const ABAS = [
  { href: '/cadastros/campus', rotulo: 'Campus' },
  { href: '/cadastros/categorias', rotulo: 'Categorias' },
  { href: '/cadastros/locais', rotulo: 'Locais' },
]

export default async function LayoutCadastros({ children }: { children: React.ReactNode }) {
  await exigirAdmin()
  // Categorias e locais são do Patrimônio: somem para a igreja sem esse módulo
  const temPatrimonio = (await dadosDaIgreja()).modulos.includes('patrimonio')
  const abas = temPatrimonio ? ABAS : ABAS.filter(a => a.href === '/cadastros/campus')

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cadastros</h1>
        <p className="text-gray-600 mt-1">Campus, categorias e locais usados no inventário</p>
      </div>
      <Abas abas={abas} />
      {children}
    </div>
  )
}
