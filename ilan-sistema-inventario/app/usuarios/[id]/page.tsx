import { notFound } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { User } from '@/types/database'
import { exigirAdmin, idsComAcesso } from '@/lib/auth'
import FormularioUsuario from '../FormularioUsuario'

export const dynamic = 'force-dynamic'

export default async function EditarUsuario({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string } }) {
  await exigirAdmin()
  const [{ data }, comAcesso] = await Promise.all([
    getSupabase().from('users').select('*').eq('id', params.id).maybeSingle(),
    idsComAcesso(),
  ])
  if (!data) notFound()
  return <FormularioUsuario usuario={data as User} erro={searchParams.erro} temAcesso={comAcesso ? comAcesso.has(data.id) : null} />
}
