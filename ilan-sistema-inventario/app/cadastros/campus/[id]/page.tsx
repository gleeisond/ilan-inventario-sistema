import Link from 'next/link'
import { notFound } from 'next/navigation'
import Aviso from '../../Aviso'
import FormCampus from '../FormCampus'
import { exigirAdmin } from '@/lib/auth'
import { daIgreja } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function EditarCampus({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string } }) {
  await exigirAdmin()
  const db = await daIgreja()
  const [{ data: campus }, { data: regioes }] = await Promise.all([
    db.select('campus', 'id, name, location, region_id').eq('id', params.id).maybeSingle(),
    db.select('regions', 'id, name').order('name'),
  ])
  if (!campus) notFound()

  return (
    <div className="space-y-4">
      <Link href="/cadastros/campus" className="text-sm text-ouro-600 hover:text-ouro-700">← Voltar para campus</Link>
      <h2 className="font-semibold text-lg">Editar {campus.name}</h2>
      <Aviso erro={searchParams.erro} />
      <FormCampus campus={campus} regioes={regioes ?? []} />
    </div>
  )
}
