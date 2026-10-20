import Link from 'next/link'
import { STATUS_COLORS, STATUS_LABELS, podeCorrigirStatus, podeEditarNoCampus } from '@/lib/equipamentos'
import { MANUTENCAO_STATUS_LABELS, STATUS_FINALIZADOS } from '@/lib/manutencoes'
import { alternarBaixa, corrigirStatus, editarEquipamento } from '../actions'
import FormEquipamento from '../FormEquipamento'
import { exigirLogin } from '@/lib/auth'
import { Equipment, MaintenanceStatus } from '@/types/database'
import { daIgreja } from '@/lib/db'

export const dynamic = 'force-dynamic'

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ouro-500 focus:border-transparent outline-none'

type ChamadoAberto = { id: string; status: MaintenanceStatus; problem_description: string }

export default async function EditarEquipamento({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string; ok?: string } }) {
  const usuario = await exigirLogin()
  const db = await daIgreja()
  const [{ data }, { data: abertosData }] = await Promise.all([
    db.select('equipment', '*, campus:campus_id (id, name, region_id)').eq('id', params.id).maybeSingle(),
    db.select('maintenance_requests', 'id, status, problem_description')
      .eq('equipment_id', params.id)
      .not('status', 'in', `(${STATUS_FINALIZADOS.join(',')})`)
      .order('created_at', { ascending: false }),
  ])
  const equipamento = data as (Equipment & { campus: { id: string; name: string; region_id: string | null } | null }) | null
  const abertos = (abertosData ?? []) as ChamadoAberto[]

  const voltar = (
    <Link href="/equipamentos" className="text-sm text-ouro-600 hover:text-ouro-700">
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

  const descartado = equipamento.status === 'descartado'

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
      {searchParams.ok && (
        <div className="mb-4 aviso p-3 rounded-lg text-sm bg-green-50 text-green-800 border border-green-200">
          {searchParams.ok}
        </div>
      )}

      {/* O status segue os chamados: abrir um chamado coloca em manutenção, concluir devolve para ativo */}
      <section className="mb-6 bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[equipamento.status]}`}>
              {STATUS_LABELS[equipamento.status]}
            </span>
          </div>
          {!descartado && (
            <Link
              href={`/manutencoes/criar?equipamento=${equipamento.id}`}
              className="bg-ouro-400 hover:bg-ouro-300 text-gray-900 font-semibold px-4 py-2 rounded-lg transition text-sm"
            >
              Reportar problema
            </Link>
          )}
        </div>

        {abertos.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {abertos.map(c => (
              <li key={c.id}>
                <Link href={`/manutencoes/${c.id}`} className="text-ouro-600 hover:text-ouro-700">
                  Chamado aberto: {c.problem_description}
                </Link>
                <span className="text-gray-500"> · {MANUTENCAO_STATUS_LABELS[c.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          !descartado && <p className="text-sm text-gray-500">Nenhum chamado aberto. Se algo quebrou, use Reportar problema.</p>
        )}

        {descartado ? (
          <form action={alternarBaixa} className="pt-2 border-t border-gray-100">
            <input type="hidden" name="id" value={equipamento.id} />
            <input type="hidden" name="retorno" value={`/equipamentos/${equipamento.id}`} />
            <p className="text-sm text-gray-600 mb-2">Este equipamento recebeu baixa e não aparece no inventário em uso.</p>
            <button type="submit" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">
              Reativar equipamento
            </button>
          </form>
        ) : (
          <details id="baixa" className="pt-2 border-t border-gray-100">
            <summary className="cursor-pointer text-sm text-gray-700 font-medium">Dar baixa</summary>
            <form action={alternarBaixa} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={equipamento.id} />
              <input type="hidden" name="retorno" value={`/equipamentos/${equipamento.id}`} />
              <label className="block text-sm font-medium text-gray-700">
                <span className="block mb-1">Motivo *</span>
                <textarea name="motivo" required rows={2} placeholder="Ex: sem conserto, doado, furtado" className={inputClass} />
              </label>
              {abertos.length > 0 && (
                <p className="text-sm text-orange-700">
                  {abertos.length === 1 ? 'O chamado aberto será encerrado' : `Os ${abertos.length} chamados abertos serão encerrados`} junto com a baixa.
                </p>
              )}
              <button type="submit" className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-sm">
                Confirmar baixa
              </button>
            </form>
          </details>
        )}

        {podeCorrigirStatus(usuario) && !descartado && (
          <details className="pt-2 border-t border-gray-100">
            <summary className="cursor-pointer text-sm text-gray-700 font-medium">Corrigir status (administrador)</summary>
            <form action={corrigirStatus} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={equipamento.id} />
              <p className="text-sm text-gray-500">Use só quando o status não bate com a realidade. A correção fica registrada nos logs.</p>
              <select name="status" defaultValue={equipamento.status} className={inputClass}>
                {(['ativo', 'danificado', 'em_manutencao'] as const).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <textarea name="justificativa" required rows={2} placeholder="Por que o status está sendo corrigido?" className={inputClass} />
              <button type="submit" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">
                Salvar correção
              </button>
            </form>
          </details>
        )}
      </section>

      <FormEquipamento acao={editarEquipamento} usuario={usuario} equipamento={equipamento} textoBotao="Salvar alterações" />
    </div>
  )
}
