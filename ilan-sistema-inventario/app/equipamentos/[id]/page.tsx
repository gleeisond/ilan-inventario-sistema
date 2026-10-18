import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { podeEditarNoCampus } from '@/lib/equipamentos'
import { editarEquipamento } from '../actions'
import FormEquipamento from '../FormEquipamento'
import { exigirLogin } from '@/lib/auth'
import { Equipment } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function EditarEquipamento({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string } }) {
  const usuario = await exigirLogin()
  const { data } = await getSupabase()
    .from('equipment')
    .select('*, campus:campus_id (id, name, region_id)')
    .eq('id', params.id)
    .maybeSingle()
  const equipamento = data as (Equipment & { campus: { id: string; name: string; region_id: string | null } | null }) | null

  const voltar = (
    <Link href="/equipamentos" className="text-sm text-indigo-600 hover:text-indigo-700">
      ← Voltar para equipamentos
    </Link>
  )

  if (!equipamento || (equipamento.campus && !podeEditarNoCampus(usuario, equipamento.campus))) {
    return (
      <div className="p-4 md:p-8 max-w-3xl">
        {voltar}
        <div className="mt-4 aviso p-3 rounded-lg text-sm bg-yellow-50 text-yellow-800 border border-yellow-200">
          {equipamento
            ? `Você não tem permissão para editar equipamentos de ${equipamento.campus?.name}.`
            : 'Equipamento não encontrado. Ele pode ter sido excluído.'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {voltar}
      <h1 className="text-2xl font-bold mt-2">Editar equipamento</h1>
      <p className="text-gray-600 mt-1 mb-6">
        {equipamento.name} · {equipamento.campus?.name}. Para mover para outro campus, troque o campo Campus.
      </p>

      {searchParams.erro && (
        <div className="mb-4 aviso aviso-erro p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          {searchParams.erro}
        </div>
      )}

      <FormEquipamento acao={editarEquipamento} usuario={usuario} equipamento={equipamento} textoBotao="Salvar alterações" />
    </div>
  )
}
