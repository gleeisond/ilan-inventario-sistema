-- 05_igrejas.sql
-- Primeira etapa do Genesis41 para várias igrejas:
--   * tabela de igrejas (a ILAN vira a primeira)
--   * igreja_id nas regiões, campus, usuários, categorias e locais
--   * perfil superadmin, acima do administrador de cada igreja
--
-- Só acrescenta: o sistema publicado hoje continua funcionando com este script rodado.
-- Rode ANTES de publicar o código que usa as igrejas. Pode ser rodado de novo sem efeito.
-- Equipamentos e manutenções pertencem a um campus, então herdam a igreja dele.

alter type user_role add value if not exists 'superadmin';

create table if not exists igrejas (
  id uuid primary key default gen_random_uuid(),
  nome varchar(120) not null unique,
  cidade text,
  responsavel text,
  contato text,
  cor_principal varchar(7) not null default '#E0AE4E' check (cor_principal ~ '^#[0-9A-Fa-f]{6}$'),
  plano varchar(20) not null default 'essencial' check (plano in ('essencial', 'rede', 'ministerio', 'sob_consulta')),
  -- implantacao: cadastrada, usuários ainda não entram | ativa: em uso | suspensa: acesso bloqueado
  situacao varchar(20) not null default 'implantacao' check (situacao in ('implantacao', 'ativa', 'suspensa')),
  modulos text[] not null default '{patrimonio}',
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

-- Só o servidor (chave service_role) lê e grava igrejas
alter table igrejas enable row level security;
revoke all on igrejas from anon, authenticated;

insert into igrejas (nome, situacao, plano)
values ('ILAN Church', 'ativa', 'ministerio')
on conflict (nome) do nothing;

alter table regions add column if not exists igreja_id uuid references igrejas(id) on delete restrict;
alter table campus add column if not exists igreja_id uuid references igrejas(id) on delete restrict;
alter table users add column if not exists igreja_id uuid references igrejas(id) on delete restrict;
alter table categories add column if not exists igreja_id uuid references igrejas(id) on delete restrict;
alter table locations add column if not exists igreja_id uuid references igrejas(id) on delete restrict;
-- Log sem igreja (null) é ação da plataforma, feita no painel Genesis41
alter table activity_logs add column if not exists igreja_id uuid references igrejas(id) on delete set null;

-- Tudo o que já existe é da ILAN (o superadmin fica sem igreja)
update regions set igreja_id = (select id from igrejas where nome = 'ILAN Church') where igreja_id is null;
update campus set igreja_id = (select id from igrejas where nome = 'ILAN Church') where igreja_id is null;
update categories set igreja_id = (select id from igrejas where nome = 'ILAN Church') where igreja_id is null;
update locations set igreja_id = (select id from igrejas where nome = 'ILAN Church') where igreja_id is null;
-- Só os logs anteriores a este script: os sem igreja criados depois são ações da plataforma
update activity_logs set igreja_id = (select id from igrejas where nome = 'ILAN Church')
where igreja_id is null and created_at < (select criada_em from igrejas where nome = 'ILAN Church');
update users set igreja_id = (select id from igrejas where nome = 'ILAN Church')
where igreja_id is null and role::text <> 'superadmin';

-- Nomes passam a ser únicos dentro de cada igreja: duas igrejas podem ter um campus "Centro"
alter table campus drop constraint if exists campus_name_key;
alter table regions drop constraint if exists regions_name_key;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'campus_igreja_nome_key') then
    alter table campus add constraint campus_igreja_nome_key unique (igreja_id, name);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'regions_igreja_nome_key') then
    alter table regions add constraint regions_igreja_nome_key unique (igreja_id, name);
  end if;
end $$;

create index if not exists idx_regions_igreja on regions (igreja_id);
create index if not exists idx_campus_igreja on campus (igreja_id);
create index if not exists idx_users_igreja on users (igreja_id);
create index if not exists idx_activity_logs_igreja on activity_logs (igreja_id, created_at desc);
