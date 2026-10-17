import { salvarCampus } from '../actions'

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none'

type Campus = { id: string; name: string; location: string | null; region_id: string }

export default function FormCampus({ campus, regioes }: { campus?: Campus; regioes: { id: string; name: string }[] }) {
  return (
    <form action={salvarCampus} className="bg-white rounded-lg border border-gray-200 p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      {campus && <input type="hidden" name="id" value={campus.id} />}
      <label className="block text-sm font-medium text-gray-700">
        <span className="block mb-1">Nome *</span>
        <input name="name" required defaultValue={campus?.name} placeholder="Ex: Ilan Bangu" className={inputClass} />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        <span className="block mb-1">Região *</span>
        <select name="region_id" required defaultValue={campus?.region_id ?? ''} className={inputClass}>
          <option value="" disabled>Selecione</option>
          {regioes.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-gray-700">
        <span className="block mb-1">Endereço</span>
        <input name="location" defaultValue={campus?.location ?? ''} placeholder="Rua, número, bairro" className={inputClass} />
      </label>
      <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition">
        {campus ? 'Salvar alterações' : 'Criar campus'}
      </button>
    </form>
  )
}
