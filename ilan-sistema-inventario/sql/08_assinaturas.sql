-- 08_assinaturas.sql
-- Assinaturas das igrejas (cobradas pelo Asaas) e convites para o administrador de cada igreja.
-- Requer 05, 06 e 07. Pode ser rodado de novo sem efeito.
-- As tabelas são da plataforma: só o servidor (service_role) lê e grava.

-- ---------- Dados de cobrança de cada igreja ----------
alter table igrejas add column if not exists cpf_cnpj varchar(18);
alter table igrejas add column if not exists email_cobranca text;
alter table igrejas add column if not exists telefone_cobranca text;
-- Valor mensal combinado (null = preço do plano)
alter table igrejas add column if not exists valor_mensal numeric(10, 2);
alter table igrejas add column if not exists dia_vencimento smallint not null default 10 check (dia_vencimento between 1 and 28);
alter table igrejas add column if not exists asaas_cliente_id text unique;
alter table igrejas add column if not exists asaas_assinatura_id text unique;
-- Exceção dada pelo superadmin: não bloqueia por atraso até esta data
alter table igrejas add column if not exists liberada_ate date;

-- ---------- Faturas (uma por mês, espelho das cobranças do Asaas) ----------
create table if not exists cobrancas (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null references igrejas(id) on delete restrict,
  asaas_id text not null unique,
  valor numeric(10, 2) not null,
  vencimento date not null,
  -- pendente | paga | vencida | estornada | cancelada
  situacao varchar(12) not null check (situacao in ('pendente', 'paga', 'vencida', 'estornada', 'cancelada')),
  situacao_asaas text,
  forma text,
  pago_em date,
  link_fatura text,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);
create index if not exists idx_cobrancas_igreja on cobrancas (igreja_id, vencimento desc);
create index if not exists idx_cobrancas_abertas on cobrancas (igreja_id, vencimento) where situacao in ('pendente', 'vencida');

-- Eventos recebidos do Asaas: o Asaas pode mandar o mesmo evento mais de uma vez
create table if not exists asaas_eventos (
  id text primary key,
  evento text not null,
  asaas_cobranca_id text,
  dados jsonb not null,
  recebido_em timestamptz not null default now(),
  erro text
);

-- ---------- Convites para o administrador da igreja ----------
create table if not exists convites (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null references igrejas(id) on delete cascade,
  -- Só o hash do código fica guardado: o link completo aparece uma vez no painel
  token_hash text not null unique,
  nome text not null,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  usado_em timestamptz,
  usuario_id uuid references users(id) on delete set null
);
create index if not exists idx_convites_igreja on convites (igreja_id);

alter table cobrancas enable row level security;
alter table asaas_eventos enable row level security;
alter table convites enable row level security;
revoke all on cobrancas, asaas_eventos, convites from anon, authenticated;
