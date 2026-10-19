import Abas from '@/components/Abas'
import { exigirSuperadmin } from '@/lib/auth'

const ABAS = [
  { href: '/plataforma/igrejas', rotulo: 'Igrejas' },
  { href: '/plataforma/modulos', rotulo: 'Módulos' },
]

// Painel da plataforma Genesis41: só o superadmin entra
export default async function LayoutPlataforma({ children }: { children: React.ReactNode }) {
  await exigirSuperadmin()

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <img src="/genesis41-positivo.svg" alt="Genesis41" className="h-6 w-auto" />
        <span className="h-6 w-px bg-gray-300" aria-hidden="true" />
        <p className="text-gray-600">Painel da plataforma</p>
      </div>
      <Abas abas={ABAS} />
      {children}
    </div>
  )
}
