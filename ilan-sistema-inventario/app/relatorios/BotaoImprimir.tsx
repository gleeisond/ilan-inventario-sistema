'use client'

export default function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 print:hidden"
    >
      Imprimir / PDF
    </button>
  )
}
