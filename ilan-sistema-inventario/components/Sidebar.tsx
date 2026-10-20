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
  const caminho = headers().get('x-pathname') ?? ''
  if (caminho === '/login' || caminho.startsWith('/convite/')) return null

  const usuario = await getUsuarioAtual()
  // O administrador Genesis41 só vê o painel da plataforma: nenhum dado de igreja no menu
  const superadmin = Boolean(usuario?.superadmin)
  const igreja = superadmin ? null : await dadosDaIgreja()
  // Sem login ligado, todos veem tudo. Com login, Usuários e Logs são só do admin.
  const podeAdministrar = !loginAtivo() || usuario?.role === 'admin'
  // O menu mostra só as telas dos módulos que a igreja tem liberados
  const temPatrimonio = Boolean(igreja?.modulos.includes('patrimonio'))

  return (
    <MenuLateral>
      <img src="/genesis41-negativo.svg" alt="Genesis41" className="hidden md:block w-full max-w-[170px] mb-6" />
      {igreja && <div className="mb-8 px-3"><MarcaIgreja igreja={igreja} /></div>}
      {superadmin ? (
        <div className="mb-8">
          <p className="px-3 mb-2 text-[11px] uppercase tracking-[0.18em] text-ouro-400">Genesis41</p>
          <NavMenu
            itens={[
              { href: '/plataforma/igrejas', rotulo: 'Igrejas' },
              { href: '/plataforma/assinaturas', rotulo: 'Assinaturas' },
              { href: '/plataforma/modulos', rotulo: 'Próximos módulos' },
              { href: '/plataforma/equipe', rotulo: 'Equipe Genesis41' },
            ]}
          />
        </div>
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
      </div>
    </MenuLateral>
  )
}
