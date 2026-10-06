'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabase } from '@/lib/supabase'

function texto(form: FormData, campo: string) {
  const valor = String(form.get(campo) ?? '').trim()
  return valor === '' ? null : valor
}

export async function criarEquipamento(form: FormData) {
  const name = texto(form, 'name')
  const campus_id = texto(form, 'campus_id')

  if (!name || !campus_id) {
    redirect('/equipamentos/criar?erro=' + encodeURIComponent('Preencha o nome e o campus.'))
  }

  const valorTexto = texto(form, 'value')
  // Aceita "4.250,90" (formato brasileiro) e "4250.90"
  const valorNormalizado = valorTexto?.includes(',') ? valorTexto.replace(/\./g, '').replace(',', '.') : valorTexto
  const value = valorNormalizado ? Number(valorNormalizado) : null
  if (value !== null && Number.isNaN(value)) {
    redirect('/equipamentos/criar?erro=' + encodeURIComponent('Valor inválido. Use só números, ex: 3500,00'))
  }

  const { error } = await getSupabase().from('equipment').insert({
    name,
    campus_id,
    value,
    brand: texto(form, 'brand'),
    category: texto(form, 'category'),
    purchase_date: texto(form, 'purchase_date'),
    responsible_id: texto(form, 'responsible_id'),
    status: texto(form, 'status') ?? 'ativo',
    location: texto(form, 'location'),
    notes: texto(form, 'notes'),
  })

  if (error) {
    redirect('/equipamentos/criar?erro=' + encodeURIComponent('Não foi possível salvar: ' + error.message))
  }

  revalidatePath('/equipamentos')
  redirect('/equipamentos?criado=1')
}
