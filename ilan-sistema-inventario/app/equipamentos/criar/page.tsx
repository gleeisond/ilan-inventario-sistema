import Link from 'next/link'
import { criarEquipamento } from '../actions'
import FormEquipamento from '../FormEquipamento'
import { exigirLogin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function CriarEquipamento({ searchParams }: { searchParams: { erro?: string } }) {
  const usuario = await exigirLogin()

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <Link href="/equipamentos" className="text-sm text-indigo-600 hover:text-indigo-700">
        ← Voltar para equipamentos
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Novo equipamento</h1>

      {searchParams.erro && (
        <div className="mb-4 aviso aviso-erro p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          {searchParams.erro}
        </div>
      )}

      <FormEquipamento acao={criarEquipamento} usuario={usuario} textoBotao="Salvar equipamento" />
    </div>
  )
}
