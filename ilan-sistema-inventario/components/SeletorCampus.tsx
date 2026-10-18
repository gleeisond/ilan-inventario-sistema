'use client'

import { useRouter } from 'next/navigation'

// Menu de campus do dashboard: escolher um campus já abre a visão dele
export default function SeletorCampus({ campus, atual }: { campus: { id: string; name: string }[]; atual: string }) {
  const router = useRouter()

  return (
    <label className="flex flex-col text-sm text-gray-700 gap-1">
      Campus
      <select
        value={atual}
        onChange={e => router.push(`/dashboard?campus=${e.target.value}`)}
        className="min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg bg-white font-medium text-gray-900"
      >
        <option value="todos">Todos os campus</option>
        {campus.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </label>
  )
}
