import { entrar } from './actions'

export const dynamic = 'force-dynamic'

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none'

export default function Login({ searchParams }: { searchParams: { erro?: string; voltar?: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-900">
      <div className="w-full max-w-sm">
        <img src="/logo-ilan.png" alt="Ilan Church" className="entrada w-64 mx-auto" />
        <p className="entrada text-gray-400 text-center mt-4 mb-8" style={{ '--atraso': '150ms' } as React.CSSProperties}>
          Inventário de Mídia
        </p>

        <form
          action={entrar}
          className="entrada bg-white rounded-lg border border-gray-200 p-6 space-y-4 shadow-2xl shadow-black/40"
          style={{ '--atraso': '300ms' } as React.CSSProperties}
        >
          <input type="hidden" name="voltar" value={searchParams.voltar ?? ''} />
          {searchParams.erro && (
            <div className="aviso aviso-erro p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{searchParams.erro}</div>
          )}
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-1">Usuário</span>
            <input name="login" required autoFocus autoCapitalize="none" autoComplete="username" className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-1">Senha</span>
            <input name="senha" type="password" required autoComplete="current-password" className={inputClass} />
          </label>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition">
            Entrar
          </button>
          <p className="text-xs text-gray-500 text-center">No primeiro acesso, use a senha que o administrador passou. Depois você pode trocá-la. Esqueceu? Peça ao administrador uma nova.</p>
        </form>
      </div>
    </div>
  )
}
