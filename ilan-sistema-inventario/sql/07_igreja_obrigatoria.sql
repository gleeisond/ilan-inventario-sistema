-- 07_igreja_obrigatoria.sql
-- Última etapa do isolamento: igreja_id passa a ser obrigatório.
-- Rode DEPOIS de publicar a versão do sistema que grava igreja_id (a do 06_isolamento_igrejas.sql).
-- Pode ser rodado de novo sem efeito.

-- Registros criados pela versão anterior durante a troca só podem ser da ILAN, a única igreja ativa até aqui
update categories set igreja_id = (select id from igrejas where nome = 'ILAN Church') where igreja_id is null;
update locations set igreja_id = (select id from igrejas where nome = 'ILAN Church') where igreja_id is null;
update regions set igreja_id = (select id from igrejas where nome = 'ILAN Church') where igreja_id is null;
update users set igreja_id = (select id from igrejas where nome = 'ILAN Church') where igreja_id is null and role <> 'superadmin';

alter table regions alter column igreja_id set not null;
alter table campus alter column igreja_id set not null;
alter table categories alter column igreja_id set not null;
alter table locations alter column igreja_id set not null;
alter table equipment alter column igreja_id set not null;
alter table maintenance_requests alter column igreja_id set not null;
alter table maintenance_logs alter column igreja_id set not null;
alter table maintenance_notifications alter column igreja_id set not null;
alter table equipment_history alter column igreja_id set not null;

-- Só o superadmin fica sem igreja
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_igreja_obrigatoria') then
    alter table users add constraint users_igreja_obrigatoria check (role = 'superadmin' or igreja_id is not null);
  end if;
end $$;
