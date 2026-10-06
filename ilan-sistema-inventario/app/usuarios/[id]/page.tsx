import { notFound } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { User } from '@/types/database'
import FormularioUsuario from '../FormularioUsuario'

export const dynamic = 'force-dynamic'

export default async function EditarUsuario({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string } }) {
  const { data } = await getSupabase().from('users').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()
  return <FormularioUsuario usuario={data as User} erro={searchParams.erro} />
}
