import { redirect } from 'next/navigation'

// Tela antiga de login por e-mail. O acesso agora é por usuário e senha em /login.
export default function Auth() {
  redirect('/login')
}
