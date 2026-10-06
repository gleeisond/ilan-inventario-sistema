import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { STATUS_LABELS } from '@/lib/equipamentos'
import { criarEquipamento } from './actions'

export const dynamic = 'force-dynamic'

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none'

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      <span className="block mb-1">{label}</span>
      {children}
    </label>
  )
}

export default async function CriarEquipamento({ searchParams }: { searchParams: { erro?: string } }) {
  const supabase = getSupabase()
  const [{ data: campusList, error: erroCampus }, { data: usuarios, error: erroUsuarios }, { data: categorias }, { data: locais }] =
    await Promise.all([
      supabase.from('campus').select('id, name').order('name'),
      supabase.from('users').select('id, name').eq('is_active', true).order('name'),
      supabase.from('categories').select('name').order('name'),
      supabase.from('locations').select('name').order('name'),
    ])

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <Link href="/equipamentos" className="text-sm text-indigo-600 hover:text-indigo-700">
        ← Voltar para equipamentos
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Novo equipamento</h1>

      {(erroCampus || erroUsuarios) && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          Erro ao carregar campus e responsáveis: {(erroCampus ?? erroUsuarios)?.message}
        </div>
      )}

      {!erroCampus && campusList?.length === 0 && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-yellow-50 text-yellow-800 border border-yellow-200">
          Nenhum campus encontrado. Confira se o schema.sql foi rodado no Supabase (ele libera a leitura da tabela campus).
        </div>
      )}

      {searchParams.erro && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          {searchParams.erro}
        </div>
      )}

      <form action={criarEquipamento} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <Campo label="Nome *">
          <input name="name" required placeholder="Ex: Câmera Sony a6700" className={inputClass} />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Marca">
            <input name="brand" placeholder="Ex: Sony" className={inputClass} />
          </Campo>
          <Campo label="Categoria">
            <select name="category" defaultValue="" className={inputClass}>
              <option value="">Selecione</option>
              {categorias?.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Campus *">
            <select name="campus_id" required defaultValue="" className={inputClass}>
              <option value="" disabled>Selecione</option>
              {campusList?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Responsável">
            <select name="responsible_id" defaultValue="" className={inputClass}>
              <option value="">Nenhum</option>
              {usuarios?.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Status">
            <select name="status" defaultValue="ativo" className={inputClass}>
              {Object.entries(STATUS_LABELS).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>{rotulo}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Local">
            <select name="location" defaultValue="" className={inputClass}>
              <option value="">Selecione</option>
              {locais?.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(l => (
                <option key={l.name} value={l.name}>{l.name}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Valor (R$)">
            <input name="value" inputMode="decimal" placeholder="Ex: 3500,00" className={inputClass} />
          </Campo>
          <Campo label="Data de compra">
            <input name="purchase_date" type="date" className={inputClass} />
          </Campo>
        </div>

        <Campo label="Observações">
          <textarea name="notes" rows={3} className={inputClass} />
        </Campo>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition">
            Salvar equipamento
          </button>
          <Link href="/equipamentos" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
