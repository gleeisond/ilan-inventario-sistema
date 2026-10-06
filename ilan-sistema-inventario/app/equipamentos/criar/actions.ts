'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabase } from '@/lib/supabase'
import { lerMoeda } from '@/lib/equipamentos'
import { exigirLogin, registrarLog } from '@/lib/auth'

function texto(form: FormData, campo: string) {
  const valor = String(form.get(campo) ?? '').trim()
  return valor === '' ? null : valor
}

export async function criarEquipamento(form: FormData) {
  await exigirLogin()
  const name = texto(form, 'name')
  const campus_id = texto(form, 'campus_id')

  if (!name || !campus_id) {
    redirect('/equipamentos/criar?erro=' + encodeURIComponent('Preencha o nome e o campus.'))
  }

  const value = lerMoeda(texto(form, 'value'))
  if (value !== null && Number.isNaN(value)) {
    redirect('/equipamentos/criar?erro=' + encodeURIComponent('Valor inválido. Use só números, ex: 3500,00'))
  }

  const { data: criado, error } = await getSupabase()
    .from('equipment')
    .insert({
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
    .select('id, campus:campus_id (name)')
    .single()

  if (error) {
    redirect('/equipamentos/criar?erro=' + encodeURIComponent('Não foi possível salvar: ' + error.message))
  }

  const campus = (criado as unknown as { campus: { name: string } | null }).campus
  await registrarLog({
    acao: 'equipamento_criado',
    descricao: `Cadastrou o equipamento ${name}${campus ? ` em ${campus.name}` : ''}`,
    entidade: 'equipment',
    entidade_id: criado.id,
  })

  revalidatePath('/equipamentos')
  redirect('/equipamentos?criado=1')
}
