'use client'

// Botão de excluir que pede confirmação antes de enviar o formulário
export default function BotaoExcluir({ nome }: { nome: string }) {
  return (
    <button
      type="submit"
      onClick={e => {
        if (!confirm(`Excluir "${nome}"? Isso não pode ser desfeito.`)) e.preventDefault()
      }}
      className="text-red-600 hover:text-red-700"
    >
      Excluir
    </button>
  )
}
