import FormularioUsuario from '../FormularioUsuario'

export const dynamic = 'force-dynamic'

export default function NovoUsuario({ searchParams }: { searchParams: { erro?: string } }) {
  return <FormularioUsuario erro={searchParams.erro} />
}
