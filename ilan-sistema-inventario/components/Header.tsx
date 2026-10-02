export default function Header({title}: {title?: string}) {
  return (
    <header className="bg-white border-b border-gray-200 p-6">
      <h1 className="text-2xl font-bold">{title || 'ILAN'}</h1>
    </header>
  )
}
