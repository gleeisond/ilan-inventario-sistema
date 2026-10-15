-- ====================================
-- 001 · Equipamentos: permissões (RLS) e histórico automático
-- Rodar no SQL Editor do Supabase DEPOIS de schema.sql e seed_data.sql.
-- Pode ser rodado mais de uma vez.
-- ====================================

-- Novo tipo de evento para edições de dados (nome, valor, local...)
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'editado';

-- ------------------------------------
-- Funções de apoio. SECURITY DEFINER evita que as políticas consultem a
-- tabela users passando pelo RLS dela mesma (o que gerava recursão infinita).
-- ------------------------------------
CREATE OR REPLACE FUNCTION public.app_role() RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM users WHERE id = auth.uid() AND is_active
$$;

CREATE OR REPLACE FUNCTION public.app_campus() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT campus_id FROM users WHERE id = auth.uid() AND is_active
$$;

CREATE OR REPLACE FUNCTION public.app_region() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT region_id FROM users WHERE id = auth.uid() AND is_active
$$;

-- Quem pode VER os equipamentos de um campus
CREATE OR REPLACE FUNCTION public.can_see_campus(target uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE app_role()
    WHEN 'admin' THEN true
    WHEN 'rodrigo' THEN true
    WHEN 'lider_regional' THEN EXISTS (SELECT 1 FROM campus WHERE id = target AND region_id = app_region())
    WHEN 'pastor' THEN target = app_campus()
    WHEN 'lider_midia' THEN target = app_campus()
    ELSE false
  END
$$;

-- Quem pode CADASTRAR e EDITAR equipamentos de um campus
CREATE OR REPLACE FUNCTION public.can_edit_campus(target uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE app_role()
    WHEN 'admin' THEN true
    WHEN 'lider_regional' THEN EXISTS (SELECT 1 FROM campus WHERE id = target AND region_id = app_region())
    WHEN 'lider_midia' THEN target = app_campus()
    ELSE false
  END
$$;

-- ------------------------------------
-- Remove as políticas antigas (algumas tinham sintaxe inválida no schema original)
-- ------------------------------------
DROP POLICY IF EXISTS admin_all ON users;
DROP POLICY IF EXISTS admin_all_equipment ON equipment;
DROP POLICY IF EXISTS lider_see_own_campus ON equipment;

-- ------------------------------------
-- users: cada pessoa vê o próprio cadastro; admin vê e altera todos;
-- quem enxerga um campus vê as pessoas dele (para escolher responsável).
-- ------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_admin_write ON users;
CREATE POLICY users_select ON users FOR SELECT TO authenticated
  USING (id = auth.uid() OR app_role() = 'admin' OR app_role() = 'lider_regional' OR (campus_id IS NOT NULL AND can_see_campus(campus_id)));
CREATE POLICY users_admin_write ON users FOR ALL TO authenticated
  USING (app_role() = 'admin') WITH CHECK (app_role() = 'admin');

-- regions e campus: leitura para quem está logado
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS regions_select ON regions;
DROP POLICY IF EXISTS campus_select ON campus;
DROP POLICY IF EXISTS campus_admin_write ON campus;
CREATE POLICY regions_select ON regions FOR SELECT TO authenticated USING (true);
CREATE POLICY campus_select ON campus FOR SELECT TO authenticated USING (true);
CREATE POLICY campus_admin_write ON campus FOR ALL TO authenticated
  USING (app_role() = 'admin') WITH CHECK (app_role() = 'admin');

-- ------------------------------------
-- equipment
-- ------------------------------------
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS equipment_select ON equipment;
DROP POLICY IF EXISTS equipment_insert ON equipment;
DROP POLICY IF EXISTS equipment_update ON equipment;
DROP POLICY IF EXISTS equipment_delete ON equipment;
CREATE POLICY equipment_select ON equipment FOR SELECT TO authenticated USING (can_see_campus(campus_id));
CREATE POLICY equipment_insert ON equipment FOR INSERT TO authenticated WITH CHECK (can_edit_campus(campus_id));
CREATE POLICY equipment_update ON equipment FOR UPDATE TO authenticated
  USING (can_edit_campus(campus_id)) WITH CHECK (can_edit_campus(campus_id));
CREATE POLICY equipment_delete ON equipment FOR DELETE TO authenticated USING (app_role() = 'admin');

-- ------------------------------------
-- equipment_history: só leitura pelo app; quem grava é o gatilho abaixo
-- ------------------------------------
ALTER TABLE equipment_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS equipment_history_select ON equipment_history;
CREATE POLICY equipment_history_select ON equipment_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM equipment e WHERE e.id = equipment_id AND can_see_campus(e.campus_id)));

-- maintenance_requests: leitura, para a ficha do equipamento.
-- A escrita será definida junto com as telas de manutenção.
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS maintenance_select ON maintenance_requests;
CREATE POLICY maintenance_select ON maintenance_requests FOR SELECT TO authenticated USING (can_see_campus(campus_id));

-- ------------------------------------
-- updated_at automático
-- ------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS equipment_set_updated_at ON equipment;
CREATE TRIGGER equipment_set_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------
-- Histórico automático. Mesmas regras de lib/equipamentos/history.ts.
-- ------------------------------------
CREATE OR REPLACE FUNCTION public.log_equipment_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor uuid := auth.uid();
  ev event_type;
  old_fields jsonb := '{}'::jsonb;
  new_fields jsonb := '{}'::jsonb;
  f text;
BEGIN
  -- Alterações feitas fora do app (SQL Editor, importação) não têm autor e não entram no histórico.
  IF actor IS NULL OR NOT EXISTS (SELECT 1 FROM users WHERE id = actor) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO equipment_history (equipment_id, event_type, description, changed_by_id, new_value)
    VALUES (NEW.id, 'criado', 'Equipamento cadastrado', actor, jsonb_build_object('campus_id', NEW.campus_id));
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    ev := CASE
      WHEN NEW.status = 'danificado' THEN 'danificado'
      WHEN NEW.status = 'ativo' AND OLD.status IN ('danificado', 'em_manutencao') THEN 'consertado'
      ELSE 'status_alterado'
    END;
    INSERT INTO equipment_history (equipment_id, event_type, description, changed_by_id, old_value, new_value)
    VALUES (NEW.id, ev, 'Status alterado', actor, jsonb_build_object('status', OLD.status), jsonb_build_object('status', NEW.status));
  END IF;

  IF NEW.campus_id IS DISTINCT FROM OLD.campus_id THEN
    INSERT INTO equipment_history (equipment_id, event_type, description, changed_by_id, old_value, new_value)
    VALUES (NEW.id, 'movido', 'Campus alterado', actor, jsonb_build_object('campus_id', OLD.campus_id), jsonb_build_object('campus_id', NEW.campus_id));
  END IF;

  IF NEW.responsible_id IS DISTINCT FROM OLD.responsible_id THEN
    INSERT INTO equipment_history (equipment_id, event_type, description, changed_by_id, old_value, new_value)
    VALUES (NEW.id, 'responsavel_alterado', 'Responsável alterado', actor,
            jsonb_build_object('responsible_id', OLD.responsible_id), jsonb_build_object('responsible_id', NEW.responsible_id));
  END IF;

  FOREACH f IN ARRAY ARRAY['name', 'brand', 'category', 'value', 'purchase_date', 'location', 'notes'] LOOP
    IF to_jsonb(NEW) -> f IS DISTINCT FROM to_jsonb(OLD) -> f THEN
      old_fields := old_fields || jsonb_build_object(f, to_jsonb(OLD) -> f);
      new_fields := new_fields || jsonb_build_object(f, to_jsonb(NEW) -> f);
    END IF;
  END LOOP;
  IF new_fields <> '{}'::jsonb THEN
    INSERT INTO equipment_history (equipment_id, event_type, description, changed_by_id, old_value, new_value)
    VALUES (NEW.id, 'editado', 'Dados editados', actor, old_fields, new_fields);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS equipment_log_change ON equipment;
CREATE TRIGGER equipment_log_change AFTER INSERT OR UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION public.log_equipment_change();

-- ------------------------------------
-- Cadastro de nova conta: cria o perfil em users, inativo e sem campus.
-- O administrador libera o acesso (is_active = true) e define papel e campus.
-- ------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO users (id, email, name, role, is_active)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1), 'lider_midia', false)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
