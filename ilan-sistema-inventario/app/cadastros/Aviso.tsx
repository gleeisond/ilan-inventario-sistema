export default function Aviso({ erro, salvo }: { erro?: string; salvo?: string }) {
  if (erro) return <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{erro}</div>
  if (salvo) return <div className="p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">{salvo}</div>
  return null
}
