import Link from 'next/link'
import { headers } from 'next/headers'
import { getUsuarioAtual } from '@/lib/auth'
import { loginAtivo } from '@/lib/sessao'
import { PERFIL_LABELS } from '@/lib/usuarios'
import { sair } from '@/app/login/actions'
import MenuLateral from './MenuLateral'
import InstalarApp from './InstalarApp'
import NavMenu from './NavMenu'

export default async function Sidebar() {
  if (headers().get('x-pathname') === '/login') return null

  const usuario = await getUsuarioAtual()
  // Sem login ligado, todos veem tudo. Com login, Usuários e Logs são só do admin.
  const podeAdministrar = !loginAtivo() || usuario?.role === 'admin'

  return (
    <MenuLateral>
      <img src="/logo-ilan.png" alt="Ilan Church" className="hidden md:block w-full max-w-[200px] mb-8" />
      <NavMenu
        itens={[
          { href: '/dashboard', rotulo: 'Dashboard' },
          { href: '/equipamentos', rotulo: 'Equipamentos' },
          { href: '/manutencoes', rotulo: 'Manutenções' },
          { href: '/relatorios', rotulo: 'Relatórios' },
          ...(podeAdministrar
            ? [
                { href: '/usuarios', rotulo: 'Usuários' },
                { href: '/cadastros', rotulo: 'Cadastros' },
                { href: '/logs', rotulo: 'Logs' },
              ]
            : []),
        ]}
      />
      {usuario?.superadmin && (
        <div className="mt-8">
          <p className="px-3 mb-2 text-[11px] uppercase tracking-[0.18em] text-ouro-400">Genesis41</p>
          <NavMenu
            itens={[
              { href: '/plataforma/igrejas', rotulo: 'Igrejas' },
              { href: '/plataforma/modulos', rotulo: 'Próximos módulos' },
            ]}
          />
        </div>
      )}
      <div className="mt-auto pt-8 text-sm">
        {usuario ? (
          <>
            <p className="font-medium">{usuario.name}</p>
            <p className="text-gray-400">{PERFIL_LABELS[usuario.superadmin ? 'superadmin' : usuario.role]}</p>
            <Link href="/minha-senha" className="block mt-3 text-gray-300 hover:text-white">Trocar minha senha</Link>
            <form action={sair}>
              <button type="submit" className="mt-2 text-gray-300 hover:text-white">Sair</button>
            </form>
          </>
        ) : (
          !loginAtivo() && <p className="text-gray-400">Login desligado (modo de teste)</p>
        )}
        <InstalarApp />
        {/* Assinatura do produto: a igreja aparece em cima, a Genesis41 no rodapé */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gray-400">
          por
          <img src="/genesis41-negativo.svg" alt="Genesis41" className="h-3.5 w-auto opacity-80" />
        </div>
      </div>
    </MenuLateral>
  )
}
