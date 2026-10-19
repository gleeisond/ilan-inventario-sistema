-- 06_isolamento_igrejas.sql
-- Segunda etapa do Genesis41 para várias igrejas: cada igreja é independente.
--   * igreja_id também em equipamentos, chamados, histórico e notificações
--   * gatilhos que recusam qualquer registro ligado a campus, equipamento ou usuário de outra igreja
--   * a igreja de um registro nunca muda depois de criado
--
-- Requer o 05_igrejas.sql. Pode ser rodado de novo sem efeito.
-- Continua compatível com a versão anterior do sistema (que não grava igreja_id): os gatilhos
-- preenchem a igreja a partir da região, do campus ou do equipamento. Depois de publicar a
-- versão nova, rode o 07_igreja_obrigatoria.sql.

-- ---------- Colunas ----------
-- Logo de cada igreja no menu (sem logo, o menu mostra o nome)
alter table igrejas add column if not exists logo_url text;
update igrejas set logo_url = '/logo-ilan.png' where nome = 'ILAN Church' and logo_url is null;

alter table equipment add column if not exists igreja_id uuid references igrejas(id) on delete restrict;
alter table maintenance_requests add column if not exists igreja_id uuid references igrejas(id) on delete restrict;
alter table maintenance_logs add column if not exists igreja_id uuid references igrejas(id) on delete restrict;
alter table maintenance_notifications add column if not exists igreja_id uuid references igrejas(id) on delete restrict;
alter table equipment_history add column if not exists igreja_id uuid references igrejas(id) on delete restrict;

update equipment e set igreja_id = c.igreja_id from campus c where c.id = e.campus_id and e.igreja_id is null;
update maintenance_requests m set igreja_id = e.igreja_id from equipment e where e.id = m.equipment_id and m.igreja_id is null;
update maintenance_logs l set igreja_id = m.igreja_id from maintenance_requests m where m.id = l.maintenance_request_id and l.igreja_id is null;
update maintenance_notifications n set igreja_id = m.igreja_id from maintenance_requests m where m.id = n.maintenance_request_id and n.igreja_id is null;
update equipment_history h set igreja_id = e.igreja_id from equipment e where e.id = h.equipment_id and h.igreja_id is null;

-- Categorias e locais: o mesmo nome pode existir em igrejas diferentes
alter table categories drop constraint if exists categories_name_key;
alter table locations drop constraint if exists locations_name_key;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'categories_igreja_nome_key') then
    alter table categories add constraint categories_igreja_nome_key unique (igreja_id, name);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'locations_igreja_nome_key') then
    alter table locations add constraint locations_igreja_nome_key unique (igreja_id, name);
  end if;
end $$;

create index if not exists idx_equipment_igreja on equipment (igreja_id);
create index if not exists idx_maintenance_requests_igreja on maintenance_requests (igreja_id);
create index if not exists idx_maintenance_logs_igreja on maintenance_logs (igreja_id);
create index if not exists idx_categories_igreja on categories (igreja_id);
create index if not exists idx_locations_igreja on locations (igreja_id);

-- ---------- Gatilhos de integridade ----------

-- O usuário pertence à igreja (o superadmin, sem igreja, pode agir em qualquer uma)
create or replace function g41_usuario_da_igreja(uid uuid, igreja uuid) returns boolean
language sql stable set search_path = public as $$
  select uid is null or exists (
    select 1 from users u where u.id = uid and (u.igreja_id = igreja or u.role = 'superadmin')
  )
$$;

-- Confere a igreja esperada (vinda do registro pai) e impede a troca de igreja
create or replace function g41_conferir_igreja(registro text, atual uuid, anterior uuid, esperada uuid, operacao text)
returns uuid language plpgsql as $$
begin
  if esperada is null then
    raise exception 'Isolamento: % sem igreja de origem', registro using errcode = 'check_violation';
  end if;
  if operacao = 'UPDATE' and anterior is not null and anterior is distinct from esperada then
    raise exception 'Isolamento: % não pode mudar de igreja', registro using errcode = 'check_violation';
  end if;
  if atual is not null and atual <> esperada then
    raise exception 'Isolamento: % ligado a outra igreja', registro using errcode = 'check_violation';
  end if;
  return esperada;
end $$;

create or replace function g41_isolar_campus() returns trigger language plpgsql set search_path = public as $$
begin
  if new.igreja_id is null then
    new.igreja_id := (select igreja_id from regions where id = new.region_id);
  end if;
  if tg_op = 'UPDATE' and old.igreja_id is not null and new.igreja_id is distinct from old.igreja_id then
    raise exception 'Isolamento: campus não pode mudar de igreja' using errcode = 'check_violation';
  end if;
  if (select igreja_id from regions where id = new.region_id) is distinct from new.igreja_id then
    raise exception 'Isolamento: região de outra igreja' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create or replace function g41_isolar_raiz() returns trigger language plpgsql set search_path = public as $$
begin
  -- regiões, categorias e locais: só não podem trocar de igreja (preencher a que faltava pode)
  if tg_op = 'UPDATE' and old.igreja_id is not null and new.igreja_id is distinct from old.igreja_id then
    raise exception 'Isolamento: % não pode mudar de igreja', tg_table_name using errcode = 'check_violation';
  end if;
  return new;
end $$;

create or replace function g41_isolar_usuario() returns trigger language plpgsql set search_path = public as $$
begin
  -- Sem igreja informada (versão anterior do sistema): vem do campus ou da região
  if new.igreja_id is null and new.role <> 'superadmin' then
    new.igreja_id := coalesce((select igreja_id from campus where id = new.campus_id), (select igreja_id from regions where id = new.region_id));
  end if;
  if tg_op = 'UPDATE' and old.igreja_id is not null and new.igreja_id is distinct from old.igreja_id
     and new.role <> 'superadmin' then
    raise exception 'Isolamento: usuário não pode mudar de igreja' using errcode = 'check_violation';
  end if;
  if new.campus_id is not null and (select igreja_id from campus where id = new.campus_id) is distinct from new.igreja_id then
    raise exception 'Isolamento: campus de outra igreja' using errcode = 'check_violation';
  end if;
  if new.region_id is not null and (select igreja_id from regions where id = new.region_id) is distinct from new.igreja_id then
    raise exception 'Isolamento: região de outra igreja' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create or replace function g41_isolar_equipamento() returns trigger language plpgsql set search_path = public as $$
begin
  new.igreja_id := g41_conferir_igreja('equipamento', new.igreja_id, case when tg_op = 'UPDATE' then old.igreja_id end,
    (select igreja_id from campus where id = new.campus_id), tg_op);
  if not g41_usuario_da_igreja(new.responsible_id, new.igreja_id) then
    raise exception 'Isolamento: responsável de outra igreja' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create or replace function g41_isolar_chamado() returns trigger language plpgsql set search_path = public as $$
begin
  new.igreja_id := g41_conferir_igreja('chamado', new.igreja_id, case when tg_op = 'UPDATE' then old.igreja_id end,
    (select igreja_id from equipment where id = new.equipment_id), tg_op);
  if (select igreja_id from campus where id = new.campus_id) is distinct from new.igreja_id then
    raise exception 'Isolamento: campus do chamado é de outra igreja' using errcode = 'check_violation';
  end if;
  if not g41_usuario_da_igreja(new.created_by_id, new.igreja_id) or not g41_usuario_da_igreja(new.assigned_to_id, new.igreja_id) then
    raise exception 'Isolamento: usuário do chamado é de outra igreja' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create or replace function g41_isolar_log_chamado() returns trigger language plpgsql set search_path = public as $$
begin
  new.igreja_id := g41_conferir_igreja('registro do chamado', new.igreja_id, case when tg_op = 'UPDATE' then old.igreja_id end,
    (select igreja_id from maintenance_requests where id = new.maintenance_request_id), tg_op);
  if not g41_usuario_da_igreja(new.performed_by_id, new.igreja_id) then
    raise exception 'Isolamento: usuário de outra igreja' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create or replace function g41_isolar_notificacao() returns trigger language plpgsql set search_path = public as $$
begin
  new.igreja_id := g41_conferir_igreja('notificação', new.igreja_id, case when tg_op = 'UPDATE' then old.igreja_id end,
    (select igreja_id from maintenance_requests where id = new.maintenance_request_id), tg_op);
  if not g41_usuario_da_igreja(new.recipient_id, new.igreja_id) then
    raise exception 'Isolamento: destinatário de outra igreja' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create or replace function g41_isolar_historico() returns trigger language plpgsql set search_path = public as $$
begin
  new.igreja_id := g41_conferir_igreja('histórico', new.igreja_id, case when tg_op = 'UPDATE' then old.igreja_id end,
    (select igreja_id from equipment where id = new.equipment_id), tg_op);
  if not g41_usuario_da_igreja(new.changed_by_id, new.igreja_id) then
    raise exception 'Isolamento: usuário de outra igreja' using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists trg_g41_isolar on regions;
create trigger trg_g41_isolar before update on regions for each row execute function g41_isolar_raiz();
drop trigger if exists trg_g41_isolar on categories;
create trigger trg_g41_isolar before update on categories for each row execute function g41_isolar_raiz();
drop trigger if exists trg_g41_isolar on locations;
create trigger trg_g41_isolar before update on locations for each row execute function g41_isolar_raiz();
drop trigger if exists trg_g41_isolar on campus;
create trigger trg_g41_isolar before insert or update on campus for each row execute function g41_isolar_campus();
drop trigger if exists trg_g41_isolar on users;
create trigger trg_g41_isolar before insert or update on users for each row execute function g41_isolar_usuario();
drop trigger if exists trg_g41_isolar on equipment;
create trigger trg_g41_isolar before insert or update on equipment for each row execute function g41_isolar_equipamento();
drop trigger if exists trg_g41_isolar on maintenance_requests;
create trigger trg_g41_isolar before insert or update on maintenance_requests for each row execute function g41_isolar_chamado();
drop trigger if exists trg_g41_isolar on maintenance_logs;
create trigger trg_g41_isolar before insert or update on maintenance_logs for each row execute function g41_isolar_log_chamado();
drop trigger if exists trg_g41_isolar on maintenance_notifications;
create trigger trg_g41_isolar before insert or update on maintenance_notifications for each row execute function g41_isolar_notificacao();
drop trigger if exists trg_g41_isolar on equipment_history;
create trigger trg_g41_isolar before insert or update on equipment_history for each row execute function g41_isolar_historico();

-- As funções só servem aos gatilhos: a chave pública não chama nenhuma delas
revoke all on function g41_usuario_da_igreja(uuid, uuid) from public, anon, authenticated;
revoke all on function g41_conferir_igreja(text, uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function g41_usuario_da_igreja(uuid, uuid) to service_role;
grant execute on function g41_conferir_igreja(text, uuid, uuid, uuid, text) to service_role;
