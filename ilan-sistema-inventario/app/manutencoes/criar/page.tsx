import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { PRIORIDADE_LABELS } from '@/lib/manutencoes'
import { getUsuarioAtual, exigirLogin } from '@/lib/auth'
import { criarManutencao } from '../actions'

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

type EquipamentoOpcao = { id: string; name: string; campus: { name: string } | null }

export default async function CriarManutencao({ searchParams }: { searchParams: { erro?: string; equipamento?: string } }) {
  await exigirLogin()
  const supabase = getSupabase()
  const [{ data: equipData, error: erroEquip }, { data: usuarios, error: erroUsuarios }] = await Promise.all([
    supabase.from('equipment').select('id, name, campus:campus_id (name)').neq('status', 'descartado').order('name'),
    supabase.from('users').select('id, name').eq('is_active', true).order('name'),
  ])
  const equipamentos = (equipData ?? []) as unknown as EquipamentoOpcao[]
  const usuarioLogado = await getUsuarioAtual()

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <Link href="/manutencoes" className="text-sm text-indigo-600 hover:text-indigo-700">
        ← Voltar para manutenções
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Novo chamado de manutenção</h1>

      {(erroEquip || erroUsuarios) && (
        <div className="mb-4 aviso aviso-erro p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          Erro ao carregar equipamentos e pessoas: {(erroEquip ?? erroUsuarios)?.message}
        </div>
      )}

      {searchParams.erro && (
        <div className="mb-4 aviso aviso-erro p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
          {searchParams.erro}
        </div>
      )}

      <form action={criarManutencao} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <Campo label="Equipamento *">
          <select name="equipment_id" required defaultValue={searchParams.equipamento ?? ''} className={inputClass}>
            <option value="" disabled>Selecione</option>
            {equipamentos.map(e => (
              <option key={e.id} value={e.id}>
                {e.name}{e.campus ? ` · ${e.campus.name}` : ''}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Qual é o problema? *">
          <textarea
            name="problem_description"
            required
            rows={3}
            placeholder="Ex: Projetor não liga, luz de lâmpada piscando"
            className={inputClass}
          />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Prioridade">
            <select name="priority" defaultValue="media" className={inputClass}>
              {Object.entries(PRIORIDADE_LABELS).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>{rotulo}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Previsão de conclusão">
            <input name="scheduled_completion_date" type="date" className={inputClass} />
          </Campo>
          <Campo label="Aberto por *">
            {usuarioLogado ? (
              <p className="px-3 py-2 text-gray-900">{usuarioLogado.name}</p>
            ) : (
              <select name="created_by_id" required defaultValue="" className={inputClass}>
                <option value="" disabled>Selecione</option>
                {usuarios?.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            )}
          </Campo>
          <Campo label="Responsável pelo conserto">
            <select name="assigned_to_id" defaultValue="" className={inputClass}>
              <option value="">Ninguém ainda</option>
              {usuarios?.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo label="Observações">
          <textarea name="notes" rows={2} className={inputClass} />
        </Campo>

        <p className="text-xs text-gray-500">Ao abrir o chamado, o equipamento passa para &quot;Em manutenção&quot;.</p>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition">
            Abrir chamado
          </button>
          <Link href="/manutencoes" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
