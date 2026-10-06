import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { PERFIS, PERFIL_DESCRICOES, PERFIL_LABELS } from '@/lib/usuarios'
import { User } from '@/types/database'
import { emailParaLogin } from '@/lib/auth'
import { salvarUsuario } from './actions'

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none'

function Campo({ label, dica, children }: { label: string; dica?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      <span className="block mb-1">{label}</span>
      {children}
      {dica && <span className="block mt-1 text-xs font-normal text-gray-500">{dica}</span>}
    </label>
  )
}

// Formulário compartilhado entre o cadastro e a edição
export default async function FormularioUsuario({
  usuario,
  erro,
  temAcesso,
}: {
  usuario?: User
  erro?: string
  temAcesso?: boolean | null
}) {
  const supabase = getSupabase()
  const [{ data: campusList }, { data: regioes }] = await Promise.all([
    supabase.from('campus').select('id, name').order('name'),
    supabase.from('regions').select('id, name').order('name'),
  ])

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <Link href="/usuarios" className="text-sm text-indigo-600 hover:text-indigo-700">
        ← Voltar para usuários
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">{usuario ? `Editar ${usuario.name}` : 'Novo usuário'}</h1>

      {erro && <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{erro}</div>}

      <form action={salvarUsuario} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        {usuario && <input type="hidden" name="id" value={usuario.id} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome *">
            <input name="name" required defaultValue={usuario?.name} placeholder="Ex: João Silva" className={inputClass} />
          </Campo>
          <Campo label="Usuário (para entrar) *" dica="Letras minúsculas, números, ponto ou hífen. Ex: joao.silva">
            <input
              name="login"
              required
              autoCapitalize="none"
              autoComplete="off"
              pattern="[a-z0-9._\-]{3,40}"
              defaultValue={usuario ? emailParaLogin(usuario.email) : ''}
              placeholder="joao.silva"
              className={inputClass}
            />
          </Campo>
          <Campo
            label={usuario ? 'Nova senha' : 'Senha'}
            dica={
              usuario
                ? temAcesso === false
                  ? 'Este usuário ainda não tem senha. Defina uma para liberar o acesso.'
                  : 'Deixe em branco para manter a senha atual.'
                : 'Mínimo de 6 caracteres. Você pode definir depois.'
            }
          >
            <input name="senha" type="password" minLength={6} autoComplete="new-password" className={inputClass} />
          </Campo>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">Perfil *</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PERFIS.map(perfil => (
              <label
                key={perfil}
                className="flex gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
              >
                <input type="radio" name="role" value={perfil} required defaultChecked={usuario?.role === perfil} className="mt-1" />
                <span>
                  <span className="block font-medium text-gray-900">{PERFIL_LABELS[perfil]}</span>
                  <span className="block text-xs text-gray-600">{PERFIL_DESCRICOES[perfil]}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Campus" dica="Obrigatório para Pastor e Líder de mídia.">
            <select name="campus_id" defaultValue={usuario?.campus_id ?? ''} className={inputClass}>
              <option value="">Nenhum</option>
              {campusList?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Região" dica="Obrigatório para Líder regional.">
            <select name="region_id" defaultValue={usuario?.region_id ?? ''} className={inputClass}>
              <option value="">Nenhuma</option>
              {regioes?.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </Campo>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="is_active" defaultChecked={usuario?.is_active ?? true} />
          Acesso liberado
          <span className="text-xs text-gray-500">(desmarque para bloquear a entrada; a pessoa some das listas de responsáveis)</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition">
            Salvar usuário
          </button>
          <Link href="/usuarios" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
