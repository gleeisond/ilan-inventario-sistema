import { redirect } from 'next/navigation'

// Login temporariamente desligado: a página inicial abre direto o dashboard.
export default function Home() {
  redirect('/dashboard')
}
