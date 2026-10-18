-- Fecha o banco para a chave pública (anon), que fica exposta no navegador.
-- Rodar SÓ DEPOIS que estiver publicada na Vercel a versão em que o servidor usa a
-- SUPABASE_SERVICE_ROLE_KEY (lib/supabase.ts). Antes disso, o sistema para de funcionar.
--
-- Depois deste script, só a service_role (usada no servidor) lê e grava dados.
-- Os scripts 01 a 03 recriam a política aberta "acesso_teste": se algum deles
-- for rodado de novo, rode este em seguida.

DROP POLICY IF EXISTS acesso_teste ON public.regions;
DROP POLICY IF EXISTS acesso_teste ON public.campus;
DROP POLICY IF EXISTS acesso_teste ON public.users;
DROP POLICY IF EXISTS acesso_teste ON public.equipment;
DROP POLICY IF EXISTS acesso_teste ON public.equipment_history;
DROP POLICY IF EXISTS acesso_teste ON public.maintenance_requests;
DROP POLICY IF EXISTS acesso_teste ON public.maintenance_logs;
DROP POLICY IF EXISTS acesso_teste ON public.maintenance_notifications;
DROP POLICY IF EXISTS acesso_teste ON public.activity_logs;
DROP POLICY IF EXISTS acesso_teste ON public.categories;
DROP POLICY IF EXISTS acesso_teste ON public.locations;

-- RLS ligado e sem políticas: anon e authenticated não veem nada.
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- As views rodavam com a permissão do dono e ignoravam o RLS.
ALTER VIEW public.v_equipment_by_campus SET (security_invoker = true);
ALTER VIEW public.v_pending_maintenance SET (security_invoker = true);
ALTER VIEW public.v_maintenance_cost_monthly SET (security_invoker = true);
REVOKE ALL ON public.v_equipment_by_campus, public.v_pending_maintenance, public.v_maintenance_cost_monthly FROM anon, authenticated;
