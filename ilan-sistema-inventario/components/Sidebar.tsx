import { headers } from 'next/headers'
import { getUsuarioAtual } from '@/lib/auth'
import { loginAtivo } from '@/lib/sessao'
import { PERFIL_LABELS } from '@/lib/usuarios'
import { sair } from '@/app/login/actions'
import MenuLateral from './MenuLateral'
import InstalarApp from './InstalarApp'

export default async function Sidebar() {
  if (headers().get('x-pathname') === '/login') return null

  const usuario = await getUsuarioAtual()
  // Sem login ligado, todos veem tudo. Com login, Usuários e Logs são só do admin.
  const podeAdministrar = !loginAtivo() || usuario?.role === 'admin'

  return (
    <MenuLateral>
      <img src="/logo-ilan.png" alt="Ilan Church" className="hidden md:block w-full max-w-[200px] mb-10" />
      <nav className="space-y-4">
        <a href="/dashboard" className="block hover:text-gray-300">Dashboard</a>
        <a href="/equipamentos" className="block hover:text-gray-300">Equipamentos</a>
        <a href="/manutencoes" className="block hover:text-gray-300">Manutenções</a>
        <a href="/relatorios" className="block hover:text-gray-300">Relatórios</a>
        {podeAdministrar && (
          <>
            <a href="/usuarios" className="block hover:text-gray-300">Usuários</a>
            <a href="/cadastros" className="block hover:text-gray-300">Cadastros</a>
            <a href="/logs" className="block hover:text-gray-300">Logs</a>
          </>
        )}
      </nav>
      <div className="mt-auto pt-8 text-sm">
        {usuario ? (
          <>
            <p className="font-medium">{usuario.name}</p>
            <p className="text-gray-400">{PERFIL_LABELS[usuario.role]}</p>
            <a href="/minha-senha" className="block mt-3 text-gray-300 hover:text-white">Trocar minha senha</a>
            <form action={sair}>
              <button type="submit" className="mt-2 text-gray-300 hover:text-white">Sair</button>
            </form>
          </>
        ) : (
          !loginAtivo() && <p className="text-gray-400">Login desligado (modo de teste)</p>
        )}
        <InstalarApp />
      </div>
    </MenuLateral>
  )
}
