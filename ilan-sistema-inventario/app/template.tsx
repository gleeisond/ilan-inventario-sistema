// Envolve cada página para que ela entre animada a cada troca de tela (ver .pagina em globals.css)
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="pagina">{children}</div>
}
