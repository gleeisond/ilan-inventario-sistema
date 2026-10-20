-- Fecha o banco para a chave pública (anon), que fica exposta no navegador.
-- Rodar SÓ DEPOIS que estiver publicada na Vercel a versão em que o servidor usa a
-- SUPABASE_SERVICE_ROLE_KEY (lib/supabase.ts). Antes disso, o sistema para de funcionar.
--
-- Depois deste script, só a service_role (usada no servidor) lê e grava dados.
-- Os scripts 01 a 03 recriam a política aberta "acesso_teste": se algum deles
-- for rodado de novo, rode este em seguida.

-- A política aberta "acesso_teste" passa a negar tudo e vira "bloqueado" (o mesmo efeito de
-- apagá-la, sem o DROP, que o Supabase segura pedindo confirmação). RLS ligado: anon e
-- authenticated não veem nada.
do $$
declare t text;
begin
  foreach t in array array['regions','campus','users','equipment','equipment_history','maintenance_requests','maintenance_logs','maintenance_notifications','activity_logs','categories','locations'] loop
    if exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'acesso_teste') then
      execute format('alter policy acesso_teste on public.%I using (false) with check (false)', t);
      execute format('alter policy acesso_teste on public.%I rename to bloqueado', t);
    end if;
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- As views rodavam com a permissão do dono e ignoravam o RLS.
ALTER VIEW public.v_equipment_by_campus SET (security_invoker = true);
ALTER VIEW public.v_pending_maintenance SET (security_invoker = true);
ALTER VIEW public.v_maintenance_cost_monthly SET (security_invoker = true);
REVOKE ALL ON public.v_equipment_by_campus, public.v_pending_maintenance, public.v_maintenance_cost_monthly FROM anon, authenticated;
