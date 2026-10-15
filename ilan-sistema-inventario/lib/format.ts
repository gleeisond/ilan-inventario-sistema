// lib/format.ts
// Formatação no padrão brasileiro: moeda, datas e valores digitados.

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return brl.format(value)
}

// Datas sem horário ('2024-03-10') são lidas sem fuso, para não voltar um dia.
export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const [y, m, d] = value.slice(0, 10).split('-')
  if (!y || !m || !d) return '—'
  return `${d}/${m}/${y}`
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// Tempo desde a compra, em anos e meses ("2 anos e 3 meses").
export function formatAge(purchaseDate?: string | null, today = new Date()): string {
  if (!purchaseDate) return '—'
  const [y, m] = purchaseDate.slice(0, 10).split('-').map(Number)
  if (!y || !m) return '—'
  let months = (today.getFullYear() - y) * 12 + (today.getMonth() + 1 - m)
  if (months < 0) return '—'
  const years = Math.floor(months / 12)
  months = months % 12
  const parts: string[] = []
  if (years) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`)
  if (months) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`)
  return parts.length ? parts.join(' e ') : 'menos de 1 mês'
}

// Converte o que a pessoa digita ("1.250,00", "1250", "R$ 980,5") em número.
export function parseBRL(input: string): number | null {
  const cleaned = input.replace(/[R$\s]/g, '').trim()
  if (!cleaned) return null
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned
  const value = Number(normalized)
  return Number.isFinite(value) ? value : NaN
}

export function toBRLInput(value?: number | null): string {
  if (value === null || value === undefined) return ''
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function todayISO(today = new Date()): string {
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
