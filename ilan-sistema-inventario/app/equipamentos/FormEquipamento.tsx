import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { STATUS_LABELS, podeEditarNoCampus } from '@/lib/equipamentos'
import { UsuarioAtual } from '@/lib/auth'
import { Equipment } from '@/types/database'

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ouro-500 focus:border-transparent outline-none'

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      <span className="block mb-1">{label}</span>
      {children}
    </label>
  )
}

function valorParaTexto(valor?: number | null) {
  if (valor == null) return ''
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Formulário usado para cadastrar e para editar. Só mostra os campus em que o usuário pode mexer.
export default async function FormEquipamento({
  acao,
  usuario,
  equipamento,
  textoBotao,
}: {
  acao: (form: FormData) => Promise<void>
  usuario: UsuarioAtual | null
  equipamento?: Partial<Equipment>
  textoBotao: string
}) {
  const supabase = getSupabase()
  const [{ data: campusList, error: erroCampus }, { data: usuarios, error: erroUsuarios }, { data: categorias }, { data: locais }] =
    await Promise.all([
      supabase.from('campus').select('id, name, region_id').order('name'),
      supabase.from('users').select('id, name').eq('is_active', true).order('name'),
      supabase.from('categories').select('name').order('name'),
      supabase.from('locations').select('name').order('name'),
    ])

  const campusPermitidos = (campusList ?? []).filter(c => podeEditarNoCampus(usuario, c))
  const e = equipamento ?? {}
  const ordenar = (lista: { name: string }[] | null) => (lista ?? []).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  // Mantém visível um valor antigo que não está mais nos cadastros
  const comAtual = (lista: { name: string }[], atual?: string) =>
    atual && !lista.some(i => i.name === atual) ? [...lista, { name: atual }] : lista

  return (
    <>
      {(erroCampus || erroUsuarios) && (
        <div className="mb-4 aviso aviso-erro p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          Erro ao carregar campus e responsáveis: {(erroCampus ?? erroUsuarios)?.message}
        </div>
      )}

      {!erroCampus && campusList?.length === 0 && (
        <div className="mb-4 aviso p-3 rounded-lg text-sm bg-yellow-50 text-yellow-800 border border-yellow-200">
          Nenhum campus encontrado. Confira se o schema.sql foi rodado no Supabase (ele libera a leitura da tabela campus).
        </div>
      )}

      <form action={acao} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        {e.id && <input type="hidden" name="id" value={e.id} />}
        <Campo label="Nome *">
          <input name="name" required defaultValue={e.name} placeholder="Ex: Câmera Sony a6700" className={inputClass} />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Marca">
            <input name="brand" defaultValue={e.brand ?? ''} placeholder="Ex: Sony" className={inputClass} />
          </Campo>
          <Campo label="Categoria">
            <select name="category" defaultValue={e.category ?? ''} className={inputClass}>
              <option value="">Selecione</option>
              {comAtual(ordenar(categorias), e.category).map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Campus *">
            <select name="campus_id" required defaultValue={e.campus_id ?? ''} className={inputClass}>
              <option value="" disabled>Selecione</option>
              {campusPermitidos.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Responsável">
            <select name="responsible_id" defaultValue={e.responsible_id ?? ''} className={inputClass}>
              <option value="">Nenhum</option>
              {usuarios?.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Status">
            <select name="status" defaultValue={e.status ?? 'ativo'} className={inputClass}>
              {Object.entries(STATUS_LABELS).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>{rotulo}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Local">
            <select name="location" defaultValue={e.location ?? ''} className={inputClass}>
              <option value="">Selecione</option>
              {comAtual(ordenar(locais), e.location).map(l => (
                <option key={l.name} value={l.name}>{l.name}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Valor (R$)">
            <input name="value" inputMode="decimal" defaultValue={valorParaTexto(e.value)} placeholder="Ex: 3500,00" className={inputClass} />
          </Campo>
          <Campo label="Data de compra">
            <input name="purchase_date" type="date" defaultValue={e.purchase_date ?? ''} className={inputClass} />
          </Campo>
        </div>

        <Campo label="Observações">
          <textarea name="notes" rows={3} defaultValue={e.notes ?? ''} className={inputClass} />
        </Campo>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-ouro-400 hover:bg-ouro-300 text-gray-900 font-semibold px-4 py-2 rounded-lg transition">
            {textoBotao}
          </button>
          <Link href="/equipamentos" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  )
}
