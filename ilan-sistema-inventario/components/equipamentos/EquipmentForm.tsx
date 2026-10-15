'use client'
// components/equipamentos/EquipmentForm.tsx
// Formulário de cadastro e edição de equipamento.
import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Campus, Equipment, EquipmentStatus } from '@/types/database'
import type { EquipmentInput, Person } from '@/lib/equipamentos/repo'
import { CATEGORIES, STATUS_LABEL, STATUS_ORDER } from '@/lib/equipamentos/labels'
import { parseBRL, toBRLInput, todayISO } from '@/lib/format'
import ErrorBox from './ErrorBox'

interface Props {
  initial?: Equipment
  campuses: Campus[]
  people: Person[]
  submitLabel: string
  cancelHref: string
  onSubmit: (input: EquipmentInput) => Promise<void>
}

type Errors = Partial<Record<'name' | 'campus_id' | 'value' | 'purchase_date', string>>

const inputClass =
  'w-full rounded-md border bg-white px-3 py-2 text-sm text-tinta outline-none transition focus:ring-2 focus:ring-ouro/40'

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-tinta">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-erro`} className="text-xs text-[#8A2E1C]">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-cinza">{hint}</p>
      )}
    </div>
  )
}

export default function EquipmentForm({ initial, campuses, people, submitLabel, cancelHref, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [campusId, setCampusId] = useState(initial?.campus_id ?? (campuses.length === 1 ? campuses[0].id : ''))
  const [location, setLocation] = useState(initial?.location ?? '')
  const [responsibleId, setResponsibleId] = useState(initial?.responsible_id ?? '')
  const [valueText, setValueText] = useState(toBRLInput(initial?.value))
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchase_date?.slice(0, 10) ?? '')
  const [status, setStatus] = useState<EquipmentStatus>(initial?.status ?? 'ativo')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Responsáveis possíveis: quem é do campus escolhido, mais quem não tem campus fixo.
  const responsibleOptions = useMemo(
    () => people.filter(p => !p.campus_id || p.campus_id === campusId),
    [people, campusId],
  )

  function validate(): { input: EquipmentInput | null; errors: Errors } {
    const next: Errors = {}
    if (!name.trim()) next.name = 'Informe o nome do equipamento.'
    else if (name.trim().length > 120) next.name = 'Use no máximo 120 caracteres.'
    if (!campusId) next.campus_id = 'Escolha o campus onde o equipamento fica.'
    const value = parseBRL(valueText)
    if (value !== null && (Number.isNaN(value) || value < 0)) next.value = 'Digite um valor válido, por exemplo 1.250,00.'
    if (purchaseDate && purchaseDate > todayISO()) next.purchase_date = 'A data de compra não pode estar no futuro.'
    if (Object.keys(next).length) return { input: null, errors: next }

    const responsibleStillValid = responsibleOptions.some(p => p.id === responsibleId)
    return {
      errors: {},
      input: {
        name: name.trim(),
        brand: brand.trim() || null,
        category: category.trim() || null,
        campus_id: campusId,
        location: location.trim() || null,
        responsible_id: responsibleStillValid ? responsibleId : null,
        value,
        purchase_date: purchaseDate || null,
        status,
        notes: notes.trim() || null,
      },
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    const result = validate()
    setErrors(result.errors)
    if (!result.input) {
      const first = Object.keys(result.errors)[0]
      document.getElementById(first === 'campus_id' ? 'campus' : first === 'purchase_date' ? 'data-compra' : first === 'value' ? 'valor' : 'nome')?.focus()
      return
    }
    setSaving(true)
    try {
      await onSubmit(result.input)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Não foi possível salvar.')
      setSaving(false)
    }
  }

  const border = (field: keyof Errors) => (errors[field] ? 'border-[#C2523A]' : 'border-linha focus:border-tinta')

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <section className="grid gap-5 rounded-lg border border-linha bg-white p-5 md:grid-cols-2 md:p-6">
        <div className="md:col-span-2">
          <Field label="Nome do equipamento" htmlFor="nome" error={errors.name} hint="Como as pessoas do campus chamam o equipamento.">
            <input
              id="nome"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex.: Mesa de som digital X32"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'nome-erro' : undefined}
              className={`${inputClass} ${border('name')}`}
            />
          </Field>
        </div>
        <Field label="Marca" htmlFor="marca">
          <input id="marca" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ex.: Behringer" className={`${inputClass} border-linha focus:border-tinta`} />
        </Field>
        <Field label="Categoria" htmlFor="categoria" hint="Escolha da lista ou digite outra.">
          <input
            id="categoria"
            list="categorias"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Ex.: Áudio"
            className={`${inputClass} border-linha focus:border-tinta`}
          />
          <datalist id="categorias">
            {CATEGORIES.map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </section>

      <section className="grid gap-5 rounded-lg border border-linha bg-white p-5 md:grid-cols-2 md:p-6">
        <h2 className="font-display text-base font-bold text-tinta md:col-span-2">Onde fica e quem cuida</h2>
        <Field label="Campus" htmlFor="campus" error={errors.campus_id}>
          <select
            id="campus"
            value={campusId}
            onChange={e => setCampusId(e.target.value)}
            disabled={campuses.length === 1}
            aria-invalid={!!errors.campus_id}
            aria-describedby={errors.campus_id ? 'campus-erro' : undefined}
            className={`${inputClass} ${border('campus_id')} disabled:bg-papel`}
          >
            <option value="">Escolha o campus</option>
            {campuses.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Local no campus" htmlFor="local">
          <input id="local" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex.: Cabine de som" className={`${inputClass} border-linha focus:border-tinta`} />
        </Field>
        <Field
          label="Responsável"
          htmlFor="responsavel"
          hint={
            !campusId
              ? 'Escolha o campus para ver as pessoas.'
              : responsibleId && !responsibleOptions.some(p => p.id === responsibleId)
                ? 'O responsável anterior é de outro campus e será removido.'
                : undefined
          }
        >
          <select
            id="responsavel"
            value={responsibleOptions.some(p => p.id === responsibleId) ? responsibleId : ''}
            onChange={e => setResponsibleId(e.target.value)}
            className={`${inputClass} border-linha focus:border-tinta`}
          >
            <option value="">Sem responsável</option>
            {responsibleOptions.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status" htmlFor="status">
          <select id="status" value={status} onChange={e => setStatus(e.target.value as EquipmentStatus)} className={`${inputClass} border-linha focus:border-tinta`}>
            {STATUS_ORDER.map(s => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="grid gap-5 rounded-lg border border-linha bg-white p-5 md:grid-cols-2 md:p-6">
        <h2 className="font-display text-base font-bold text-tinta md:col-span-2">Compra</h2>
        <Field label="Valor de compra (R$)" htmlFor="valor" error={errors.value} hint="Usado no valor total do patrimônio.">
          <input
            id="valor"
            inputMode="decimal"
            value={valueText}
            onChange={e => setValueText(e.target.value)}
            onBlur={() => {
              const v = parseBRL(valueText)
              if (v !== null && !Number.isNaN(v) && v >= 0) setValueText(toBRLInput(v))
            }}
            placeholder="0,00"
            aria-invalid={!!errors.value}
            aria-describedby={errors.value ? 'valor-erro' : undefined}
            className={`num ${inputClass} ${border('value')}`}
          />
        </Field>
        <Field label="Data de compra" htmlFor="data-compra" error={errors.purchase_date}>
          <input
            id="data-compra"
            type="date"
            max={todayISO()}
            value={purchaseDate}
            onChange={e => setPurchaseDate(e.target.value)}
            aria-invalid={!!errors.purchase_date}
            aria-describedby={errors.purchase_date ? 'data-compra-erro' : undefined}
            className={`${inputClass} ${border('purchase_date')}`}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Observações" htmlFor="observacoes">
            <textarea
              id="observacoes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Número de série, garantia, acessórios que acompanham…"
              className={`${inputClass} border-linha focus:border-tinta`}
            />
          </Field>
        </div>
      </section>

      {submitError && <ErrorBox message={submitError} />}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-grafite px-5 py-2.5 text-sm font-semibold text-nevoa transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-ouro disabled:opacity-60"
        >
          {saving ? 'Salvando…' : submitLabel}
        </button>
        <Link href={cancelHref} className="px-3 py-2.5 text-sm text-cinza hover:text-tinta">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
