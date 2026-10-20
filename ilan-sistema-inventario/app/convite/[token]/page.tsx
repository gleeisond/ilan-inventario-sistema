import { buscarConvite } from '@/lib/convites'
import { aceitarConvite } from '../actions'

export const dynamic = 'force-dynamic'

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ouro-500 focus:border-transparent outline-none'

// Página pública do link de convite: o administrador da igreja cria o próprio acesso
export default async function Convite({ params, searchParams }: { params: { token: string }; searchParams: { erro?: string } }) {
  const convite = await buscarConvite(params.token)

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-900">
      <div className="w-full max-w-sm">
        <img src="/genesis41-negativo.svg" alt="Genesis41" className="entrada h-8 w-auto mx-auto" />
        {!convite ? (
          <div className="entrada mt-8 bg-white rounded-lg p-6 text-sm text-gray-700 space-y-2">
            <p className="font-semibold text-gray-900">Este convite não vale mais.</p>
            <p>Ele já foi usado ou passou do prazo de 7 dias. Peça um novo convite à Genesis41.</p>
          </div>
        ) : (
          <>
            <p className="entrada text-gray-300 text-center mt-6 mb-6" style={{ '--atraso': '150ms' } as React.CSSProperties}>
              Crie o seu acesso de administrador da <strong className="text-white">{convite.igreja.nome}</strong>
            </p>
            <form
              action={aceitarConvite}
              className="entrada bg-white rounded-lg border border-gray-200 p-6 space-y-4 shadow-2xl shadow-black/40"
              style={{ '--atraso': '300ms' } as React.CSSProperties}
            >
              <input type="hidden" name="token" value={params.token} />
              {searchParams.erro && (
                <div className="aviso aviso-erro p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{searchParams.erro}</div>
              )}
              <label className="block text-sm font-medium text-gray-700">
                <span className="block mb-1">Seu nome</span>
                <input name="nome" required defaultValue={convite.nome} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                <span className="block mb-1">Usuário para entrar</span>
                <input name="login" required autoCapitalize="none" autoComplete="username" pattern="[a-z0-9._\-]{3,40}" placeholder="maria.souza" className={inputClass} />
                <span className="block mt-1 text-xs font-normal text-gray-500">Letras minúsculas, números, ponto ou hífen.</span>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                <span className="block mb-1">Senha</span>
                <input name="senha" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                <span className="block mb-1">Confirme a senha</span>
                <input name="confirmacao" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
              </label>
              <button type="submit" className="w-full bg-ouro-400 hover:bg-ouro-300 text-gray-900 font-semibold px-4 py-2 rounded-lg transition">
                Criar meu acesso
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
