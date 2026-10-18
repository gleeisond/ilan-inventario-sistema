// O conteúdo de cada aba entra animado ao trocar de aba
export default function TemplateAba({ children }: { children: React.ReactNode }) {
  return <div className="aba-conteudo">{children}</div>
}
