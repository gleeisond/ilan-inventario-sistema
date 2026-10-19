import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { emailParaLogin } from '@/lib/auth'
import { PLANOS, SITUACOES, acimaDoLimite } from '@/lib/igrejas'
import { MODULOS, SITUACAO_MODULO_LABELS } from '@/lib/modulos'
import { PERFIL_LABELS } from '@/lib/usuarios'
import { Igreja, UserRole } from '@/types/database'
import Aviso from '@/app/cadastros/Aviso'
import { criarAdministrador, criarFilial, criarRegiao, salvarIgreja, salvarModulos } from '../../actions'
import CamposIgreja, { inputClass } from '../CamposIgreja'

export const dynamic = 'force-dynamic'

type Filial = { id: string; name: string; location: string | null; region: { name: string } | null }
type Pessoa = { id: string; name: string; email: string; role: UserRole; is_active: boolean }

const botaoClass = 'bg-ouro-400 hover:bg-ouro-300 text-gray-900 font-semibold px-4 py-2 rounded-lg transition'

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-semibold text-lg">{titulo}</h2>
        {descricao && <p className="text-sm text-gray-600">{descricao}</p>}
      </div>
      {children}
    </section>
  )
}

export default async function DetalheIgreja({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string; salvo?: string } }) {
  const supabase = getSupabase()
  const [{ data }, { data: regioes }, { data: filiaisData }, { data: pessoasData }] = await Promise.all([
    supabase.from('igrejas').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('regions').select('id, name').eq('igreja_id', params.id).order('name'),
    supabase.from('campus').select('id, name, location, region:region_id (name)').eq('igreja_id', params.id).order('name'),
    supabase.from('users').select('id, name, email, role, is_active').eq('igreja_id', params.id).order('name'),
  ])
  if (!data) notFound()
  const igreja = data as Igreja
  const filiais = (filiaisData ?? []) as unknown as Filial[]
  const pessoas = (pessoasData ?? []) as Pessoa[]
  const admins = pessoas.filter(p => p.role === 'admin')
  const plano = PLANOS[igreja.plano]
  const ativas = pessoas.filter(p => p.is_active).length

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Link href="/plataforma/igrejas" className="text-sm text-ouro-600 hover:text-ouro-700">
          ← Voltar para igrejas
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: igreja.cor_principal }} aria-hidden="true" />
          <h1 className="text-2xl font-bold">{igreja.nome}</h1>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${SITUACOES[igreja.situacao].cor}`}>{SITUACOES[igreja.situacao].nome}</span>
        </div>
        <p className="text-sm text-gray-600">{SITUACOES[igreja.situacao].descricao}</p>
        <Aviso erro={searchParams.erro} salvo={searchParams.salvo} />
      </div>

      <Secao titulo="Dados da igreja">
        <form action={salvarIgreja} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <input type="hidden" name="id" value={igreja.id} />
          <CamposIgreja igreja={igreja} />
          <div className="flex flex-wrap items-end gap-4">
            <label className="block text-sm font-medium text-gray-700">
              <span className="block mb-1">Situação</span>
              {igreja.situacao === 'ativa' ? (
                <p className="py-2 text-gray-600">Ativa</p>
              ) : (
                <select name="situacao" defaultValue={igreja.situacao} className={inputClass}>
                  <option value="implantacao">{SITUACOES.implantacao.nome}</option>
                  <option value="suspensa">{SITUACOES.suspensa.nome}</option>
                </select>
              )}
            </label>
            <button type="submit" className={botaoClass}>
              Salvar dados
            </button>
          </div>
          {igreja.situacao !== 'ativa' && (
            <p className="text-xs text-gray-500">
              A ativação de novas igrejas fica liberada na próxima etapa, quando os equipamentos e chamados de cada igreja estiverem separados em todas as telas.
            </p>
          )}
        </form>
      </Secao>

      <Secao
        titulo="Filiais"
        descricao={`Os campus da igreja, agrupados por região. Plano ${plano.nome}: ${plano.campus === null ? 'filiais ilimitadas' : `até ${plano.campus}`}.`}
      >
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Filial</th>
                <th className="px-5 py-3 font-semibold">Região</th>
                <th className="px-5 py-3 font-semibold">Endereço</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filiais.map(f => (
                <tr key={f.id}>
                  <td className="px-5 py-3 font-medium text-gray-900">{f.name}</td>
                  <td className="px-5 py-3">{f.region?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{f.location ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filiais.length === 0 && <p className="p-5 text-gray-500">Nenhuma filial cadastrada.</p>}
        </div>
        {acimaDoLimite(filiais.length, plano.campus) && (
          <p className="text-sm text-red-700">Esta igreja tem mais filiais do que o plano {plano.nome} permite.</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <form action={criarFilial} className="bg-white rounded-lg border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <input type="hidden" name="igreja_id" value={igreja.id} />
            <label className="block text-sm font-medium text-gray-700">
              <span className="block mb-1">Nova filial *</span>
              <input name="name" required placeholder="Ex: Campus Centro" className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              <span className="block mb-1">Região *</span>
              <select name="region_id" required defaultValue={regioes?.[0]?.id ?? ''} className={inputClass}>
                {(regioes ?? []).map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              <span className="block mb-1">Endereço</span>
              <input name="location" placeholder="Rua, número, bairro" className={inputClass} />
            </label>
            <button type="submit" className={`${botaoClass} sm:col-span-3 justify-self-start`}>
              Criar filial
            </button>
          </form>
          <form action={criarRegiao} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
            <input type="hidden" name="igreja_id" value={igreja.id} />
            <label className="block text-sm font-medium text-gray-700">
              <span className="block mb-1">Nova região</span>
              <input name="name" required placeholder="Ex: Zona Oeste" className={inputClass} />
            </label>
            <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition">
              Criar região
            </button>
          </form>
        </div>
      </Secao>

      <Secao
        titulo="Administradores"
        descricao={`Quem administra a igreja: cadastra os demais usuários, campus e equipamentos. A igreja tem ${ativas} usuário${ativas === 1 ? '' : 's'} ativo${ativas === 1 ? '' : 's'}${plano.usuarios === null ? '' : ` de ${plano.usuarios} do plano`}.`}
      >
        {admins.length > 0 && (
          <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {admins.map(a => (
              <li key={a.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-gray-900">{a.name}</span>
                <span className="text-gray-600">
                  {emailParaLogin(a.email)} · {PERFIL_LABELS[a.role]}
                  {!a.is_active && ' · bloqueado'}
                </span>
              </li>
            ))}
          </ul>
        )}
        <form action={criarAdministrador} className="bg-white rounded-lg border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <input type="hidden" name="igreja_id" value={igreja.id} />
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-1">Nome *</span>
            <input name="name" required placeholder="Ex: Maria Souza" className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-1">Usuário *</span>
            <input name="login" required autoCapitalize="none" autoComplete="off" pattern="[a-z0-9._\-]{3,40}" placeholder="maria.souza" className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-1">Senha *</span>
            <input name="senha" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
          </label>
          <button type="submit" className={botaoClass}>
            Cadastrar administrador
          </button>
        </form>
      </Secao>

      <Secao titulo="Módulos" descricao="O patrimônio vem em todos os planos. Os demais entram conforme forem saindo da prévia.">
        <form action={salvarModulos} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <input type="hidden" name="id" value={igreja.id} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MODULOS.map(m => {
              const disponivel = m.situacao === 'no_ar' && m.id !== 'patrimonio'
              return (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${disponivel ? 'border-gray-200 cursor-pointer hover:border-ouro-300' : 'border-gray-100 bg-gray-50'}`}
                >
                  <input
                    type="checkbox"
                    name="modulos"
                    value={m.id}
                    defaultChecked={igreja.modulos.includes(m.id)}
                    disabled={!disponivel}
                    className="mt-0.5 accent-ouro-500"
                  />
                  <span>
                    <span className="block font-medium text-gray-900">{m.nome}</span>
                    <span className="block text-xs text-gray-500">
                      {m.id === 'patrimonio' ? 'Incluído em todos os planos' : SITUACAO_MODULO_LABELS[m.situacao]}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
          <button type="submit" className={botaoClass}>
            Salvar módulos
          </button>
        </form>
      </Secao>
    </div>
  )
}
