import { exigirLogin } from '@/lib/auth'
import { trocarSenha } from './actions'

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

export default async function MinhaSenha({ searchParams }: { searchParams: { erro?: string; salvo?: string } }) {
  const usuario = await exigirLogin()

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-1">Minha senha</h1>
      <p className="text-gray-600 mb-6">Troque a senha que o administrador passou para você.</p>

      {searchParams.salvo && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">Senha trocada. Use a nova senha no próximo acesso.</div>
      )}
      {searchParams.erro && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{searchParams.erro}</div>
      )}

      {!usuario ? (
        <p className="text-gray-500">A troca de senha fica disponível quando o login estiver ligado.</p>
      ) : (
        // key nova a cada resposta para o formulário voltar vazio (sem as senhas digitadas)
        <form key={Date.now()} action={trocarSenha} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <Campo label="Senha atual">
            <input name="atual" type="password" required autoComplete="current-password" className={inputClass} />
          </Campo>
          <Campo label="Nova senha (mínimo 6 caracteres)">
            <input name="nova" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
          </Campo>
          <Campo label="Repita a nova senha">
            <input name="confirmacao" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
          </Campo>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition">
            Trocar senha
          </button>
        </form>
      )}
    </div>
  )
}
