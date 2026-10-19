// lib/acesso.ts
// Conta de acesso (Supabase Auth) dos usuários (só no servidor)

import { getSupabaseAdmin } from '@/lib/supabase'

// Cria ou atualiza a conta de acesso com o mesmo id do cadastro.
// Nenhum e-mail é enviado: o endereço é interno e já entra confirmado.
export async function sincronizarAcesso(id: string, email: string, senha: string | null) {
  const admin = getSupabaseAdmin()
  const atualizado = await admin.auth.admin.updateUserById(id, {
    email,
    email_confirm: true,
    ...(senha && { password: senha }),
  })
  if (!atualizado.error) return null
  if (!senha) return null // ainda não tem acesso e nenhuma senha foi definida: nada a fazer
  const criado = await admin.auth.admin.createUser({ id, email, password: senha, email_confirm: true })
  return criado.error?.message ?? null
}
