import CadastroSimples from '../CadastroSimples'

export const dynamic = 'force-dynamic'

export default function Categorias({ searchParams }: { searchParams: { erro?: string; salvo?: string } }) {
  return <CadastroSimples tipo="categorias" tabela="categories" coluna="category" titulo="Nova categoria" exemplo="Ex: Câmera" searchParams={searchParams} />
}
