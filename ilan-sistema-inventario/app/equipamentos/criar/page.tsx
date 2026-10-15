'use client'
// app/equipamentos/criar/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/profile'
import { createEquipment, listCampuses, listPeople, type Person } from '@/lib/equipamentos/repo'
import { canCreateEquipment, editableCampuses } from '@/lib/equipamentos/permissions'
import type { Campus } from '@/types/database'
import EquipmentForm from '@/components/equipamentos/EquipmentForm'
import ErrorBox from '@/components/equipamentos/ErrorBox'

export default function CriarEquipamentoPage() {
  const profile = useProfile()
  const router = useRouter()
  const [campuses, setCampuses] = useState<Campus[] | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listCampuses(), listPeople()])
      .then(([campusList, personList]) => {
        setCampuses(editableCampuses(profile, campusList))
        setPeople(personList)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Não foi possível abrir o formulário.'))
  }, [profile])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/equipamentos" className="text-sm text-cinza hover:text-tinta">
          ← Equipamentos
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-tinta">Cadastrar equipamento</h1>
      </div>

      {!canCreateEquipment(profile) ? (
        <ErrorBox message="O seu perfil pode consultar os equipamentos, mas não cadastrar. Fale com o líder de mídia do campus." />
      ) : error ? (
        <ErrorBox message={error} />
      ) : campuses === null ? (
        <div className="h-96 animate-pulse rounded-lg bg-white/70" aria-label="Carregando formulário" />
      ) : campuses.length === 0 ? (
        <ErrorBox message="O seu usuário ainda não está ligado a um campus. Peça ao administrador para definir o seu campus." />
      ) : (
        <EquipmentForm
          campuses={campuses}
          people={people}
          submitLabel="Cadastrar equipamento"
          cancelHref="/equipamentos"
          onSubmit={async input => {
            const created = await createEquipment(input, profile.id)
            router.push(`/equipamentos/${created.id}?salvo=cadastrado`)
          }}
        />
      )}
    </div>
  )
}
