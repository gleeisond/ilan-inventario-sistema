import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { PLANOS, SITUACOES, acimaDoLimite } from '@/lib/igrejas'
import { MODULOS } from '@/lib/modulos'
import { Igreja } from '@/types/database'
import Aviso from '@/app/cadastros/Aviso'
import { criarIgreja } from '../actions'
import CamposIgreja from './CamposIgreja'

export const dynamic = 'force-dynamic'

export default async function Igrejas({ searchParams }: { searchParams: { erro?: string; salvo?: string } }) {
  const supabase = getSupabase()
  const [{ data, error }, { data: campus }, { data: usuarios }] = await Promise.all([
    supabase.from('igrejas').select('*').order('criada_em'),
    supabase.from('campus').select('igreja_id'),
    supabase.from('users').select('igreja_id').eq('is_active', true),
  ])
  const igrejas = (data ?? []) as Igreja[]
  const contar = (linhas: { igreja_id: string | null }[] | null, id: string) => (linhas ?? []).filter(l => l.igreja_id === id).length
  const ativas = igrejas.filter(i => i.situacao === 'ativa').length

  return (
    <div className="space-y-8">
      <Aviso erro={searchParams.erro ?? error?.message} salvo={searchParams.salvo} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 cascata">
        {[
          { titulo: 'Igrejas', valor: igrejas.length },
          { titulo: 'Ativas', valor: ativas, detalhe: `${igrejas.length - ativas} em implantação ou suspensas` },
          { titulo: 'Filiais', valor: campus?.length ?? 0 },
          { titulo: 'Usuários ativos', valor: usuarios?.filter(u => u.igreja_id).length ?? 0 },
        ].map(c => (
          <div key={c.titulo} className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-gray-600">{c.titulo}</p>
            <p className="text-3xl font-bold mt-1 font-titulo">{c.valor}</p>
            {c.detalhe && <p className="text-xs text-gray-500 mt-1">{c.detalhe}</p>}
          </div>
        ))}
      </div>

      <section className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-5 py-3 font-semibold">Igreja</th>
              <th className="px-5 py-3 font-semibold">Situação</th>
              <th className="px-5 py-3 font-semibold">Plano</th>
              <th className="px-5 py-3 font-semibold">Filiais</th>
              <th className="px-5 py-3 font-semibold">Usuários</th>
              <th className="px-5 py-3 font-semibold">Módulos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {igrejas.map(i => {
              const plano = PLANOS[i.plano]
              const filiais = contar(campus, i.id)
              const pessoas = contar(usuarios, i.id)
              return (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/plataforma/igrejas/${i.id}`} className="flex items-center gap-3 font-medium text-gray-900 hover:text-ouro-700">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: i.cor_principal }} aria-hidden="true" />
                      {i.nome}
                    </Link>
                    {i.cidade && <p className="text-xs text-gray-500 ml-6">{i.cidade}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`whitespace-nowrap px-2 py-1 rounded-full text-xs font-medium ${SITUACOES[i.situacao].cor}`}>{SITUACOES[i.situacao].nome}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">{plano.nome}</td>
                  <td className={`px-5 py-3 ${acimaDoLimite(filiais, plano.campus) ? 'text-red-700 font-semibold' : ''}`}>
                    {filiais}
                    {plano.campus !== null && <span className="text-gray-400"> / {plano.campus}</span>}
                  </td>
                  <td className={`px-5 py-3 ${acimaDoLimite(pessoas, plano.usuarios) ? 'text-red-700 font-semibold' : ''}`}>
                    {pessoas}
                    {plano.usuarios !== null && <span className="text-gray-400"> / {plano.usuarios}</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {i.modulos.map(id => MODULOS.find(m => m.id === id)?.nome ?? id).join(', ')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {igrejas.length === 0 && <p className="p-5 text-gray-500">Nenhuma igreja cadastrada. Rode o script sql/05_igrejas.sql.</p>}
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-1">Nova igreja</h2>
        <p className="text-sm text-gray-600 mb-3">
          A igreja começa em implantação: você cadastra as filiais e o administrador, e os usuários dela só entram depois de ativada.
        </p>
        <form action={criarIgreja} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <CamposIgreja />
          <button type="submit" className="bg-ouro-400 hover:bg-ouro-300 text-gray-900 font-semibold px-4 py-2 rounded-lg transition">
            Criar igreja
          </button>
        </form>
      </section>
    </div>
  )
}
