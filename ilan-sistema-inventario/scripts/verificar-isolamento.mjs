// Barra o build se alguma tela ou ação consultar o banco sem passar por lib/db.ts (daIgreja).
// Cada igreja só pode ver os próprios dados: um .from() direto pularia o filtro da igreja.
// Uso: node scripts/verificar-isolamento.mjs (roda sozinho antes do next build)

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const raiz = new URL('..', import.meta.url).pathname

// Únicos arquivos que podem chamar .from() direto, e em quais tabelas
const AUTORIZADOS = {
  'lib/db.ts': ['*'], // o próprio filtro da igreja
  'lib/auth.ts': ['users', 'igrejas', 'activity_logs'], // sessão, igreja do contexto e log com igreja explícita
  'app/login/actions.ts': ['users'], // login: ainda não há igreja no contexto
  'app/api/manter-ativo/route.ts': ['campus'], // só conta linhas para o Supabase não pausar
  // Painel da plataforma (só superadmin): lê igrejas e conta registros de todas
  'app/plataforma/actions.ts': ['igrejas', 'users'],
  'app/plataforma/igrejas/page.tsx': ['igrejas', 'campus', 'users'],
  'app/plataforma/igrejas/[id]/page.tsx': ['igrejas', 'regions', 'campus', 'users'],
  'app/plataforma/equipe/page.tsx': ['users'], // só os superadmins (sem igreja)
  'app/plataforma/assinaturas/page.tsx': ['igrejas'],
  'app/plataforma/assinaturas/actions.ts': ['igrejas', 'cobrancas'],
  // Tabelas da plataforma (não são de uma igreja): faturas, avisos do Asaas e convites
  'lib/assinaturas.ts': ['igrejas', 'cobrancas', 'asaas_eventos'],
  'lib/convites.ts': ['convites', 'users'], // users: login único na plataforma e desfazer se a senha falhar
}

function arquivos(dir) {
  return readdirSync(dir).flatMap(nome => {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) return arquivos(caminho)
    return /\.(ts|tsx)$/.test(nome) ? [caminho] : []
  })
}

const problemas = []
for (const pasta of ['app', 'lib', 'components']) {
  for (const arquivo of arquivos(join(raiz, pasta))) {
    const rel = relative(raiz, arquivo).split(sep).join('/')
    const linhas = readFileSync(arquivo, 'utf8').split('\n')
    linhas.forEach((linha, i) => {
      for (const m of linha.matchAll(/\.from\(\s*([^)]*)\)/g)) {
        // Array.from, Buffer.from e afins não são consultas
        if (/\b(Array|Buffer|Uint8Array)\.from\(/.test(linha.slice(Math.max(0, m.index - 12), m.index + 6))) continue
        const tabela = m[1].trim().replace(/^['"`]|['"`]$/g, '')
        const permitidas = AUTORIZADOS[rel]
        if (permitidas && (permitidas.includes('*') || permitidas.includes(tabela))) continue
        problemas.push(`${rel}:${i + 1}  .from(${m[1].trim()})`)
      }
    })
  }
}

if (problemas.length) {
  console.error('\nConsulta ao banco fora de lib/db.ts. Use daIgreja() para que o filtro da igreja seja aplicado:\n')
  for (const p of problemas) console.error('  ' + p)
  console.error('')
  process.exit(1)
}
console.log('Isolamento por igreja: nenhuma consulta direta fora dos arquivos autorizados.')
