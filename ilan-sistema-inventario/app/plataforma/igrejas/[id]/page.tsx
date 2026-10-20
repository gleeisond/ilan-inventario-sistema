import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { emailParaLogin } from '@/lib/auth'
import { PLANOS, SITUACOES, acimaDoLimite } from '@/lib/igrejas'
import { MODULOS } from '@/lib/modulos'
import { PERFIL_LABELS } from '@/lib/usuarios'
import { Igreja, UserRole } from '@/types/database'
import Aviso from '@/app/cadastros/Aviso'
import { cancelarConviteAcao, criarFilial, criarRegiao, gerarConvite, salvarIgreja, salvarModulos } from '../../actions'
import { cancelarAssinatura, criarAssinatura, liberarAte, receberPorFora, salvarDadosCobranca, sincronizar } from '../../assinaturas/actions'
import { headers } from 'next/headers'
import { asaasConfigurado, ambienteAsaas } from '@/lib/asaas'
import { DIAS_PARA_BLOQUEIO, SITUACAO_COBRANCA, calcularSituacao, todasAsCobrancas } from '@/lib/assinaturas'
import { VALIDADE_CONVITE_DIAS, convitesPendentes } from '@/lib/convites'
import CamposIgreja, { inputClass } from '../CamposIgreja'

export const dynamic = 'force-dynamic'

type Filial = { id: string; name: string; location: string | null; region: { name: string } | null }
type Pessoa = { id: string; name: string; email: string; role: UserRole; is_active: boolean }

const botaoClass = 'bg-ouro-400 hover:bg-ouro-300 text-gray-900 font-semibold px-4 py-2 rounded-lg transition'

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 scroll-mt-6">
      <div>
        <h2 className="font-semibold text-lg">{titulo}</h2>
        {descricao && <p className="text-sm text-gray-600">{descricao}</p>}
      </div>
      {children}
    </section>
  )
}

export default async function DetalheIgreja({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string; salvo?: string; convite?: string } }) {
  const supabase = getSupabase()
  const [{ data }, { data: regioes }, { data: filiaisData }, { data: pessoasData }] = await Promise.all([
    supabase.from('igrejas').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('regions').select('id, name').eq('igreja_id', params.id).order('name'),
    supabase.from('campus').select('id, name, location, region:region_id (name)').eq('igreja_id', params.id).order('name'),
    supabase.from('users').select('id, name, email, role, is_active').eq('igreja_id', params.id).order('name'),
  ])
  if (!data) notFound()
  const igreja = data as Igreja
  const [cobrancas, convites] = await Promise.all([todasAsCobrancas(igreja.id), convitesPendentes(igreja.id)])
  const financeiro = calcularSituacao(cobrancas.filter(c => c.situacao === 'pendente' || c.situacao === 'vencida'), igreja.liberada_ate)
  const valorMensal = Number(igreja.valor_mensal ?? PLANOS[igreja.plano].valor)
  // Link completo do convite recém-gerado (aparece só nesta tela, uma vez)
  const host = headers().get('host')
  const linkConvite = searchParams.convite ? `${host?.startsWith('localhost') ? 'http' : 'https'}://${host}/convite/${searchParams.convite}` : null
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
              <select name="situacao" defaultValue={igreja.situacao} className={inputClass}>
                <option value="implantacao">{SITUACOES.implantacao.nome}</option>
                <option value="ativa">{SITUACOES.ativa.nome}</option>
                <option value="suspensa">{SITUACOES.suspensa.nome}</option>
              </select>
            </label>
            <button type="submit" className={botaoClass}>
              Salvar dados
            </button>
          </div>
          <p className="text-xs text-gray-500">Ativa: os usuários da igreja entram. Suspensa: ninguém da igreja entra, e os dados ficam guardados.</p>
        </form>
      </Secao>

      <Secao
        titulo="Filiais"
        descricao={`O administrador da igreja cadastra as filiais em Cadastros. Aqui você acompanha e, se quiser, adianta na implantação. Plano ${plano.nome}: ${plano.campus === null ? 'filiais ilimitadas' : `até ${plano.campus}`}.`}
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
        {linkConvite && (
          <div className="aviso rounded-lg border border-ouro-300 bg-ouro-50 p-4 text-sm space-y-2">
            <p className="font-semibold text-gray-900">Convite gerado. Copie o link agora: ele não aparece de novo.</p>
            <input readOnly value={linkConvite} className={`${inputClass} font-mono text-xs bg-white`} />
            <p className="text-gray-600">Mande pelo WhatsApp ou e-mail. Vale {VALIDADE_CONVITE_DIAS} dias e só pode ser usado uma vez. A pessoa escolhe o próprio usuário e senha.</p>
          </div>
        )}
        {convites.length > 0 && (
          <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {convites.map(c => (
              <li key={c.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  <span className="font-medium text-gray-900">{c.nome}</span>
                  <span className="text-gray-500"> · convite aguardando, vence em {new Date(c.expira_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
                </span>
                <form action={cancelarConviteAcao}>
                  <input type="hidden" name="igreja_id" value={igreja.id} />
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="text-red-700 hover:text-red-800">Cancelar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={gerarConvite} className="bg-white rounded-lg border border-gray-200 p-5 flex flex-wrap gap-4 items-end">
          <input type="hidden" name="igreja_id" value={igreja.id} />
          <label className="block text-sm font-medium text-gray-700 flex-1 min-w-[220px]">
            <span className="block mb-1">Quem vai administrar a igreja</span>
            <input name="nome" required placeholder="Ex: Maria Souza" className={inputClass} />
          </label>
          <button type="submit" className={botaoClass}>
            Gerar link de convite
          </button>
        </form>
      </Secao>

      <Secao
        titulo="Módulos liberados"
        descricao="O que esta igreja tem no sistema. Ela só vê as telas dos módulos marcados. Módulos em prévia ficam liberados e aparecem para a igreja como em implantação."
      >
        <form action={salvarModulos} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <input type="hidden" name="id" value={igreja.id} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MODULOS.map(m => (
              <label key={m.id} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm cursor-pointer hover:border-ouro-300 has-[:checked]:border-ouro-400 has-[:checked]:bg-ouro-50">
                <input type="checkbox" name="modulos" value={m.id} defaultChecked={igreja.modulos.includes(m.id)} className="mt-0.5 accent-ouro-500" />
                <span>
                  <span className="block font-medium text-gray-900">{m.nome}</span>
                  <span className="block text-xs text-gray-500">{m.situacao === 'no_ar' ? 'No ar' : 'Em prévia: liberado como em implantação'}</span>
                </span>
              </label>
            ))}
          </div>
          <button type="submit" className={botaoClass}>
            Salvar módulos
          </button>
        </form>
      </Secao>

      <section id="assinatura" className="space-y-3 scroll-mt-6">
        <div>
          <h2 className="font-semibold text-lg">Assinatura e cobrança</h2>
          <p className="text-sm text-gray-600">
            Cobrança mensal pelo Asaas ({ambienteAsaas() === 'producao' ? 'produção' : 'sandbox, sem cobrança real'}). Com {DIAS_PARA_BLOQUEIO} dias de atraso, o acesso da igreja é bloqueado
            até o pagamento.
          </p>
        </div>
        {!asaasConfigurado() && (
          <p className="aviso rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            O Asaas ainda não está configurado. Coloque ASAAS_API_KEY nas variáveis da Vercel para criar assinaturas.
          </p>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-600">Mensalidade</p>
            <p className="text-2xl font-bold font-titulo mt-1">{valorMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p className="text-xs text-gray-500 mt-1">{igreja.valor_mensal ? 'valor combinado' : `preço do plano ${plano.nome}`}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-600">Assinatura</p>
            <p className="text-2xl font-bold font-titulo mt-1">{igreja.asaas_assinatura_id ? 'Ativa' : 'Sem assinatura'}</p>
            <p className="text-xs text-gray-500 mt-1">vence todo dia {igreja.dia_vencimento}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 col-span-2">
            <p className="text-xs text-gray-600">Pagamento</p>
            <p className={`text-2xl font-bold font-titulo mt-1 ${financeiro.bloqueada ? 'text-red-700' : financeiro.atrasoDesde ? 'text-amber-700' : 'text-green-700'}`}>
              {financeiro.bloqueada ? 'Bloqueada por atraso' : financeiro.atrasoDesde ? `Atrasada há ${financeiro.diasAtraso} dia${financeiro.diasAtraso === 1 ? '' : 's'}` : 'Em dia'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {financeiro.liberadaAte
                ? `Liberada até ${financeiro.liberadaAte.split('-').reverse().join('/')} apesar do atraso`
                : financeiro.atrasoDesde && !financeiro.bloqueada
                  ? `Bloqueio em ${financeiro.bloqueioEm!.split('-').reverse().join('/')}`
                  : ' '}
            </p>
          </div>
        </div>

        <form action={salvarDadosCobranca} className="bg-white rounded-lg border border-gray-200 p-5 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <input type="hidden" name="igreja_id" value={igreja.id} />
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-1">CPF ou CNPJ</span>
            <input name="cpf_cnpj" defaultValue={igreja.cpf_cnpj ?? ''} inputMode="numeric" placeholder="Só números" className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-1">E-mail de cobrança</span>
            <input name="email_cobranca" type="email" defaultValue={igreja.email_cobranca ?? ''} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-1">Celular</span>
            <input name="telefone_cobranca" defaultValue={igreja.telefone_cobranca ?? ''} inputMode="tel" placeholder="DDD + número" className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-1">Valor combinado (R$)</span>
            <input name="valor_mensal" defaultValue={igreja.valor_mensal ? String(igreja.valor_mensal).replace('.', ',') : ''} inputMode="decimal" placeholder={`${plano.valor},00 (plano)`} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            <span className="block mb-1">Dia do vencimento</span>
            <input name="dia_vencimento" type="number" min={1} max={28} defaultValue={igreja.dia_vencimento} className={inputClass} />
          </label>
          <button type="submit" className={`${botaoClass} md:col-span-5 justify-self-start`}>
            Salvar dados de cobrança
          </button>
        </form>

        <div className="flex flex-wrap gap-3">
          {igreja.asaas_assinatura_id ? (
            <>
              <form action={sincronizar}>
                <input type="hidden" name="igreja_id" value={igreja.id} />
                <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition">Atualizar faturas do Asaas</button>
              </form>
              <form action={cancelarAssinatura}>
                <input type="hidden" name="igreja_id" value={igreja.id} />
                <button type="submit" className="px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition">Cancelar assinatura</button>
              </form>
            </>
          ) : (
            <form action={criarAssinatura}>
              <input type="hidden" name="igreja_id" value={igreja.id} />
              <button type="submit" disabled={!asaasConfigurado()} className={`${botaoClass} disabled:opacity-50`}>Criar assinatura no Asaas</button>
            </form>
          )}
          <form action={liberarAte} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="igreja_id" value={igreja.id} />
            <label className="text-sm text-gray-700">
              Liberar mesmo com atraso até{' '}
              <input name="liberada_ate" type="date" defaultValue={igreja.liberada_ate ?? ''} className="px-2 py-1.5 border border-gray-300 rounded-lg" />
            </label>
            <button type="submit" className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-100">Salvar</button>
          </form>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Vencimento</th>
                <th className="px-5 py-3 font-semibold">Valor</th>
                <th className="px-5 py-3 font-semibold">Situação</th>
                <th className="px-5 py-3 font-semibold">Pago em</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cobrancas.map(c => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-mono text-xs">{c.vencimento.split('-').reverse().join('/')}</td>
                  <td className="px-5 py-3 font-mono">{Number(c.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SITUACAO_COBRANCA[c.situacao].cor}`}>{SITUACAO_COBRANCA[c.situacao].nome}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.pago_em ? c.pago_em.split('-').reverse().join('/') : '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-4">
                      {c.link_fatura && (
                        <a href={c.link_fatura} target="_blank" rel="noopener noreferrer" className="text-ouro-600 hover:text-ouro-700">Fatura</a>
                      )}
                      {(c.situacao === 'pendente' || c.situacao === 'vencida') && (
                        <form action={receberPorFora}>
                          <input type="hidden" name="igreja_id" value={igreja.id} />
                          <input type="hidden" name="asaas_id" value={c.asaas_id} />
                          <button type="submit" className="text-gray-700 hover:text-gray-900">Recebido por fora</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cobrancas.length === 0 && <p className="p-5 text-gray-500">Nenhuma fatura ainda.</p>}
        </div>
      </section>
    </div>
  )
}
