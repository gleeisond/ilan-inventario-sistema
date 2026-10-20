import Link from 'next/link'
import { headers } from 'next/headers'
import { dadosDaIgreja, getUsuarioAtual } from '@/lib/auth'
import { loginAtivo } from '@/lib/sessao'
import { PERFIL_LABELS } from '@/lib/usuarios'
import { sair } from '@/app/login/actions'
import MenuLateral from './MenuLateral'
import InstalarApp from './InstalarApp'
import NavMenu from './NavMenu'
import MarcaIgreja from './MarcaIgreja'

export default async function Sidebar() {
  if (headers().get('x-pathname') === '/login') return null

  const usuario = await getUsuarioAtual()
  // O administrador Genesis41 só vê o painel da plataforma: nenhum dado de igreja no menu
  const superadmin = Boolean(usuario?.superadmin)
  const igreja = superadmin ? null : await dadosDaIgreja()
  // Sem login ligado, todos veem tudo. Com login, Usuários e Logs são só do admin.
  const podeAdministrar = !loginAtivo() || usuario?.role === 'admin'
  // O menu mostra só as telas dos módulos que a igreja tem liberados
  const temPatrimonio = Boolean(igreja?.modulos.includes('patrimonio'))
  const marcaGenesis = <img src="/genesis41-negativo.svg" alt="Genesis41" className="h-6 w-auto" />

  return (
    <MenuLateral marca={igreja ? <MarcaIgreja igreja={igreja} /> : marcaGenesis}>
      <div className="hidden md:block mb-8">{igreja ? <MarcaIgreja igreja={igreja} grande /> : marcaGenesis}</div>
      {superadmin ? (
        <NavMenu
          itens={[
            { href: '/plataforma/igrejas', rotulo: 'Igrejas' },
            { href: '/plataforma/modulos', rotulo: 'Próximos módulos' },
          ]}
        />
      ) : (
        <NavMenu
          itens={[
            ...(temPatrimonio
              ? [
                  { href: '/dashboard', rotulo: 'Dashboard' },
                  { href: '/equipamentos', rotulo: 'Equipamentos' },
                  { href: '/manutencoes', rotulo: 'Manutenções' },
                  { href: '/relatorios', rotulo: 'Relatórios' },
                ]
              : [{ href: '/inicio', rotulo: 'Início' }]),
            ...(podeAdministrar
              ? [
                  { href: '/usuarios', rotulo: 'Usuários' },
                  { href: '/cadastros', rotulo: 'Cadastros' },
                  { href: '/logs', rotulo: 'Logs' },
                ]
              : []),
          ]}
        />
      )}
      <div className="mt-auto pt-8 text-sm">
        {usuario ? (
          <>
            <p className="font-medium">{usuario.name}</p>
            <p className="text-gray-400">{PERFIL_LABELS[usuario.role]}</p>
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
        {!superadmin && <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gray-400">
          por
          <img src="/genesis41-negativo.svg" alt="Genesis41" className="h-3.5 w-auto opacity-80" />
        </div>}
      </div>
    </MenuLateral>
  )
}
