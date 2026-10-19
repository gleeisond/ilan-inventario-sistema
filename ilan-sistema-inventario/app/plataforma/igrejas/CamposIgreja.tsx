import { PLANOS } from '@/lib/igrejas'
import { Igreja, PlanoIgreja } from '@/types/database'

export const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ouro-500 focus:border-transparent outline-none'

// Campos de cadastro da igreja, usados para criar e para editar
export default function CamposIgreja({ igreja }: { igreja?: Igreja }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <label className="block text-sm font-medium text-gray-700 md:col-span-2">
        <span className="block mb-1">Nome da igreja *</span>
        <input name="nome" required defaultValue={igreja?.nome} placeholder="Ex: Igreja Batista Esperança" className={inputClass} />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        <span className="block mb-1">Cidade</span>
        <input name="cidade" defaultValue={igreja?.cidade ?? ''} placeholder="Ex: Rio de Janeiro, RJ" className={inputClass} />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        <span className="block mb-1">Responsável</span>
        <input name="responsavel" defaultValue={igreja?.responsavel ?? ''} placeholder="Pastor ou administrador" className={inputClass} />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        <span className="block mb-1">Contato</span>
        <input name="contato" defaultValue={igreja?.contato ?? ''} placeholder="Telefone ou e-mail" className={inputClass} />
      </label>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <label className="block text-sm font-medium text-gray-700">
          <span className="block mb-1">Plano *</span>
          <select name="plano" required defaultValue={igreja?.plano ?? 'essencial'} className={inputClass}>
            {(Object.keys(PLANOS) as PlanoIgreja[]).map(p => (
              <option key={p} value={p}>
                {PLANOS[p].nome} · {PLANOS[p].preco}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700">
          <span className="block mb-1">Cor</span>
          <input
            name="cor_principal"
            type="color"
            defaultValue={igreja?.cor_principal ?? '#E0AE4E'}
            className="h-[42px] w-14 cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
          />
        </label>
      </div>
    </div>
  )
}
