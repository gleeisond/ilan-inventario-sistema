import { getSupabase } from '@/lib/supabase'
import BotaoExcluir from '@/components/BotaoExcluir'
import { excluirSimples, salvarSimples } from './actions'
import Aviso from './Aviso'

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none'

type Props = {
  tipo: 'categorias' | 'locais'
  tabela: 'categories' | 'locations'
  coluna: 'category' | 'location'
  titulo: string
  exemplo: string
  searchParams: { erro?: string; salvo?: string }
}

// Lista de categorias ou locais: criar, renomear na própria linha e excluir
export default async function CadastroSimples({ tipo, tabela, coluna, titulo, exemplo, searchParams }: Props) {
  const supabase = getSupabase()
  const [{ data, error }, { data: equipamentos }] = await Promise.all([
    supabase.from(tabela).select('id, name').order('name'),
    supabase.from('equipment').select(coluna),
  ])
  // Ordena em português (sem separar maiúsculas e acentos)
  const lista = ((data ?? []) as { id: string; name: string }[]).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const usos = new Map<string, number>()
  for (const e of (equipamentos ?? []) as Record<string, string | null>[]) {
    const nome = e[coluna]
    if (nome) usos.set(nome, (usos.get(nome) ?? 0) + 1)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Aviso erro={searchParams.erro ?? error?.message} salvo={searchParams.salvo} />

      {/* key nova a cada resposta para o campo voltar vazio depois de criar */}
      <form key={Date.now()} action={salvarSimples} className="bg-white rounded-lg border border-gray-200 p-5 flex flex-wrap gap-3 items-end">
        <input type="hidden" name="tipo" value={tipo} />
        <label className="flex-1 min-w-[200px] block text-sm font-medium text-gray-700">
          <span className="block mb-1">{titulo}</span>
          <input name="name" required placeholder={exemplo} className={inputClass} />
        </label>
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition">
          Criar
        </button>
      </form>

      <section className="bg-white rounded-lg border border-gray-200">
        <ul className="divide-y divide-gray-100">
          {lista.map(item => (
            <li key={`${item.id}-${item.name}`} className="p-4 flex flex-wrap items-center gap-3">
              <form action={salvarSimples} className="flex-1 flex flex-wrap items-center gap-3 min-w-[260px]">
                <input type="hidden" name="tipo" value={tipo} />
                <input type="hidden" name="id" value={item.id} />
                <input name="name" required defaultValue={item.name} aria-label={`Nome de ${item.name}`} className={`${inputClass} flex-1 min-w-[160px]`} />
                <span className="text-sm text-gray-500 w-32">
                  {usos.get(item.name) ?? 0} {usos.get(item.name) === 1 ? 'equipamento' : 'equipamentos'}
                </span>
                <button type="submit" className="text-indigo-600 hover:text-indigo-700">Salvar</button>
              </form>
              <form action={excluirSimples}>
                <input type="hidden" name="tipo" value={tipo} />
                <input type="hidden" name="id" value={item.id} />
                <BotaoExcluir nome={item.name} />
              </form>
            </li>
          ))}
        </ul>
        {lista.length === 0 && <p className="p-5 text-gray-500">Nada cadastrado ainda.</p>}
      </section>
      <p className="text-xs text-gray-500">
        Ao renomear, os equipamentos que usam o nome antigo são atualizados. Só dá para excluir o que não está em nenhum equipamento.
      </p>
    </div>
  )
}
