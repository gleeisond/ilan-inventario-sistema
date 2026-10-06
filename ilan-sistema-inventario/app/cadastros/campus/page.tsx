import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import BotaoExcluir from '@/components/BotaoExcluir'
import { excluirCampus } from '../actions'
import Aviso from '../Aviso'
import FormCampus from './FormCampus'

export const dynamic = 'force-dynamic'

type CampusLinha = { id: string; name: string; location: string | null; region: { name: string } | null }

export default async function CadastroCampus({ searchParams }: { searchParams: { erro?: string; salvo?: string } }) {
  const supabase = getSupabase()
  const [{ data, error }, { data: regioes }, { data: equipamentos }, { data: usuarios }] = await Promise.all([
    supabase.from('campus').select('id, name, location, region:region_id (name)').order('name'),
    supabase.from('regions').select('id, name').order('name'),
    supabase.from('equipment').select('campus_id'),
    supabase.from('users').select('campus_id').not('campus_id', 'is', null),
  ])
  const lista = ((data ?? []) as unknown as CampusLinha[]).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const contar = (linhas: { campus_id: string | null }[] | null, id: string) => (linhas ?? []).filter(l => l.campus_id === id).length

  return (
    <div className="space-y-6">
      <Aviso erro={searchParams.erro ?? error?.message} salvo={searchParams.salvo} />

      <section>
        <h2 className="font-semibold text-lg mb-3">Novo campus</h2>
        <FormCampus key={Date.now()} regioes={regioes ?? []} />
      </section>

      <section className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-5 py-3 font-semibold">Campus</th>
              <th className="px-5 py-3 font-semibold">Região</th>
              <th className="px-5 py-3 font-semibold">Endereço</th>
              <th className="px-5 py-3 font-semibold">Equipamentos</th>
              <th className="px-5 py-3 font-semibold">Usuários</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lista.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-5 py-3">{c.region?.name ?? '—'}</td>
                <td className="px-5 py-3 text-gray-600">{c.location ?? '—'}</td>
                <td className="px-5 py-3">{contar(equipamentos, c.id)}</td>
                <td className="px-5 py-3">{contar(usuarios, c.id)}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-4">
                    <Link href={`/cadastros/campus/${c.id}`} className="text-indigo-600 hover:text-indigo-700">Editar</Link>
                    <form action={excluirCampus}>
                      <input type="hidden" name="id" value={c.id} />
                      <BotaoExcluir nome={c.name} />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lista.length === 0 && <p className="p-5 text-gray-500">Nenhum campus cadastrado.</p>}
      </section>
      <p className="text-xs text-gray-500">Um campus só pode ser excluído quando não tem equipamentos, chamados nem usuários.</p>
    </div>
  )
}
