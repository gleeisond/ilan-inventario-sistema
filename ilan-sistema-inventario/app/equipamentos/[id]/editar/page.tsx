'use client'
// app/equipamentos/[id]/editar/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useProfile } from '@/lib/profile'
import { getEquipment, listCampuses, listPeople, updateEquipment, type Person } from '@/lib/equipamentos/repo'
import { canEditEquipment, editableCampuses } from '@/lib/equipamentos/permissions'
import type { Campus, EquipmentWithRelations } from '@/types/database'
import EquipmentForm from '@/components/equipamentos/EquipmentForm'
import ErrorBox from '@/components/equipamentos/ErrorBox'

export default function EditarEquipamentoPage() {
  const { id } = useParams<{ id: string }>()
  const profile = useProfile()
  const router = useRouter()
  const [equipment, setEquipment] = useState<EquipmentWithRelations | null | undefined>(undefined)
  const [allCampuses, setAllCampuses] = useState<Campus[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getEquipment(id), listCampuses(), listPeople()])
      .then(([eq, campusList, personList]) => {
        setEquipment(eq)
        setAllCampuses(campusList)
        setPeople(personList)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Não foi possível carregar o equipamento.'))
  }, [id])

  const detailHref = `/equipamentos/${id}`

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link href={detailHref} className="text-sm text-cinza hover:text-tinta">
          ← {equipment?.name ?? 'Equipamento'}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-tinta">Editar equipamento</h1>
      </div>

      {error ? (
        <ErrorBox message={error} />
      ) : equipment === undefined ? (
        <div className="h-96 animate-pulse rounded-lg bg-white/70" aria-label="Carregando formulário" />
      ) : equipment === null ? (
        <ErrorBox message="Equipamento não encontrado. Ele pode ter sido excluído ou você não tem acesso a ele." />
      ) : !canEditEquipment(profile, equipment, allCampuses) ? (
        <ErrorBox message="O seu perfil pode consultar este equipamento, mas não editar." />
      ) : (
        <EquipmentForm
          initial={equipment}
          campuses={editableCampuses(profile, allCampuses)}
          people={people}
          submitLabel="Salvar alterações"
          cancelHref={detailHref}
          onSubmit={async input => {
            await updateEquipment(id, input, profile.id)
            router.push(`${detailHref}?salvo=editado`)
          }}
        />
      )}
    </div>
  )
}
