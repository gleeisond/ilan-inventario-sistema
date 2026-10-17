// Aparece na hora em que o usuário troca de tela, enquanto os dados chegam do banco
export default function Carregando() {
  return (
    <div className="p-4 md:p-8 space-y-8" aria-busy="true" aria-label="Carregando">
      <div className="space-y-2">
        <div className="esqueleto h-7 w-48" />
        <div className="esqueleto h-4 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="esqueleto h-24" />
        ))}
      </div>
      <div className="esqueleto h-72" />
    </div>
  )
}
