import { notFound } from 'next/navigation'
import { User } from '@/types/database'
import { exigirAdmin, idsComAcesso } from '@/lib/auth'
import FormularioUsuario from '../FormularioUsuario'
import { daIgreja } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function EditarUsuario({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string } }) {
  await exigirAdmin()
  const db = await daIgreja()
  const [{ data }, comAcesso] = await Promise.all([
    db.select('users', '*').eq('id', params.id).maybeSingle(),
    idsComAcesso(),
  ])
  if (!data) notFound()
  return <FormularioUsuario usuario={data as User} erro={searchParams.erro} temAcesso={comAcesso ? comAcesso.has(data.id) : null} />
}
