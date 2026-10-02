export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white p-6">
      <h2 className="font-bold text-xl mb-8">ILAN</h2>
      <nav className="space-y-4">
        <a href="/" className="block hover:text-gray-300">Dashboard</a>
        <a href="/equipamentos" className="block hover:text-gray-300">Equipamentos</a>
        <a href="/manutencoes" className="block hover:text-gray-300">Manutenções</a>
      </nav>
    </aside>
  )
}
