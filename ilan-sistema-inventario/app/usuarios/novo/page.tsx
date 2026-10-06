import FormularioUsuario from '../FormularioUsuario'
import { exigirAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function NovoUsuario({ searchParams }: { searchParams: { erro?: string } }) {
  await exigirAdmin()
  return <FormularioUsuario erro={searchParams.erro} />
}
