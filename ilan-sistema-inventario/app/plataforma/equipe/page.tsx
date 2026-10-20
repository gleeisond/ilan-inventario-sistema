import { getSupabase } from '@/lib/supabase'
import { emailParaLogin, getUsuarioAtual } from '@/lib/auth'
import Aviso from '@/app/cadastros/Aviso'
import { alternarSuperadmin, criarSuperadmin, redefinirSenhaSuperadmin } from '../actions'
import { inputClass } from '../igrejas/CamposIgreja'

export const dynamic = 'force-dynamic'

const botaoClass = 'bg-ouro-400 hover:bg-ouro-300 text-gray-900 font-semibold px-4 py-2 rounded-lg transition'

// Equipe Genesis41: quem administra a plataforma (perfil superadmin)
export default async function Equipe({ searchParams }: { searchParams: { erro?: string; salvo?: string } }) {
  const [{ data, error }, eu] = await Promise.all([
    getSupabase().from('users').select('id, name, email, is_active').eq('role', 'superadmin').order('name'),
    getUsuarioAtual(),
  ])
  const equipe = (data ?? []) as { id: string; name: string; email: string; is_active: boolean }[]

  return (
    <div className="space-y-8">
      <Aviso erro={searchParams.erro ?? error?.message} salvo={searchParams.salvo} />

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-lg">Administradores Genesis41</h2>
          <p className="text-sm text-gray-600">Têm acesso ao painel da plataforma e a todas as igrejas.</p>
        </div>
        <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 cascata">
          {equipe.map(p => (
            <li key={p.id} className="px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <div className="min-w-[180px] flex-1">
                <p className="font-medium text-gray-900">
                  {p.name}
                  {eu?.id === p.id && <span className="text-gray-400 font-normal"> (você)</span>}
                </p>
                <p className="text-gray-600">
                  {emailParaLogin(p.email)}
                  {!p.is_active && <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">bloqueado</span>}
                </p>
              </div>
              <form action={redefinirSenhaSuperadmin} className="flex items-center gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input name="senha" type="password" required minLength={6} autoComplete="new-password" placeholder="Nova senha" aria-label={`Nova senha de ${p.name}`} className={`${inputClass} w-40`} />
                <button type="submit" className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition">Definir</button>
              </form>
              {eu?.id !== p.id && (
                <form action={alternarSuperadmin}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className={p.is_active ? 'text-red-700 hover:underline' : 'text-green-700 hover:underline'}>
                    {p.is_active ? 'Bloquear' : 'Liberar'}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">Novo administrador Genesis41</h2>
        <form action={criarSuperadmin} className="bg-white rounded-lg border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-1">Nome *</span>
            <input name="name" required placeholder="Ex: Maria Souza" className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-1">Usuário *</span>
            <input name="login" required autoCapitalize="none" autoComplete="off" pattern="[a-z0-9._\-]{3,40}" placeholder="maria.genesis41" className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-1">Senha *</span>
            <input name="senha" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
          </label>
          <button type="submit" className={botaoClass}>Cadastrar</button>
        </form>
      </section>
    </div>
  )
}
