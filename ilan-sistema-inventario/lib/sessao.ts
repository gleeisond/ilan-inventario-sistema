// lib/sessao.ts
// Sessão de login própria: um cookie assinado (HMAC) com o id do usuário e a validade.
// Usa só Web Crypto, então funciona tanto no middleware (edge) quanto no servidor.

export const COOKIE_SESSAO = 'ilan_sessao'
export const DURACAO_SESSAO_SEGUNDOS = 7 * 24 * 60 * 60

export type DadosSessao = { uid: string; exp: number }

// O login só é exigido depois que LOGIN_ATIVO=1 for configurado na Vercel.
// Assim dá para cadastrar o primeiro admin com senha antes de fechar o sistema.
export function loginAtivo() {
  return process.env.LOGIN_ATIVO === '1' || process.env.LOGIN_ATIVO === 'true'
}

function segredo() {
  const s = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('Falta SESSION_SECRET ou SUPABASE_SERVICE_ROLE_KEY para assinar a sessão.')
  return s
}

function paraBase64Url(bytes: Uint8Array) {
  let bin = ''
  bytes.forEach(b => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function deBase64Url(texto: string) {
  const bin = atob(texto.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(bin, c => c.charCodeAt(0))
}

async function chave() {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(segredo()), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

export async function criarToken(uid: string) {
  const dados: DadosSessao = { uid, exp: Math.floor(Date.now() / 1000) + DURACAO_SESSAO_SEGUNDOS }
  const corpo = paraBase64Url(new TextEncoder().encode(JSON.stringify(dados)))
  const assinatura = await crypto.subtle.sign('HMAC', await chave(), new TextEncoder().encode(corpo))
  return `${corpo}.${paraBase64Url(new Uint8Array(assinatura))}`
}

export async function lerToken(token: string | undefined): Promise<DadosSessao | null> {
  if (!token) return null
  const [corpo, assinatura] = token.split('.')
  if (!corpo || !assinatura) return null
  try {
    const valido = await crypto.subtle.verify('HMAC', await chave(), deBase64Url(assinatura), new TextEncoder().encode(corpo))
    if (!valido) return null
    const dados = JSON.parse(new TextDecoder().decode(deBase64Url(corpo))) as DadosSessao
    if (!dados.uid || dados.exp < Date.now() / 1000) return null
    return dados
  } catch {
    return null
  }
}
