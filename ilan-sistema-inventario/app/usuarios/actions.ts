'use server'

import { randomUUID } from 'crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabase } from '@/lib/supabase'
import { PERFIS, PERFIL_VINCULO } from '@/lib/usuarios'
import { UserRole } from '@/types/database'

function texto(form: FormData, campo: string) {
  const valor = String(form.get(campo) ?? '').trim()
  return valor === '' ? null : valor
}

export async function salvarUsuario(form: FormData) {
  const id = texto(form, 'id')
  const pagina = id ? `/usuarios/${id}` : '/usuarios/novo'
  function voltarCom(erro: string): never {
    redirect(`${pagina}?erro=${encodeURIComponent(erro)}`)
  }

  const name = texto(form, 'name')
  const email = texto(form, 'email')?.toLowerCase() ?? null
  const role = texto(form, 'role') as UserRole | null

  if (!name || !email || !role) voltarCom('Preencha nome, e-mail e perfil.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) voltarCom('E-mail inválido.')
  if (!PERFIS.includes(role)) voltarCom('Perfil inválido.')

  // Guarda só o vínculo que o perfil usa, para não sobrar campus/região de um perfil anterior
  const vinculo = PERFIL_VINCULO[role]
  const campus_id = vinculo === 'campus' ? texto(form, 'campus_id') : null
  const region_id = vinculo === 'regiao' ? texto(form, 'region_id') : null
  if (vinculo === 'campus' && !campus_id) voltarCom('Escolha o campus deste usuário.')
  if (vinculo === 'regiao' && !region_id) voltarCom('Escolha a região deste usuário.')

  const dados = { name, email, role, campus_id, region_id, is_active: form.get('is_active') === 'on' }
  const supabase = getSupabase()
  const { error } = id
    ? await supabase.from('users').update(dados).eq('id', id)
    : // Sem login por enquanto, o id é gerado aqui. Quando o login voltar, o vínculo com a conta será pelo e-mail.
      await supabase.from('users').insert({ id: randomUUID(), ...dados })

  if (error) {
    voltarCom(error.code === '23505' ? 'Já existe um usuário com esse e-mail.' : 'Não foi possível salvar: ' + error.message)
  }

  revalidatePath('/usuarios')
  redirect(`/usuarios?salvo=${encodeURIComponent(name)}`)
}
