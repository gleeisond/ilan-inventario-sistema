import CadastroSimples from '../CadastroSimples'

export const dynamic = 'force-dynamic'

export default function Locais({ searchParams }: { searchParams: { erro?: string; salvo?: string } }) {
  return <CadastroSimples tipo="locais" tabela="locations" coluna="location" titulo="Novo local" exemplo="Ex: Palco principal" searchParams={searchParams} />
}
