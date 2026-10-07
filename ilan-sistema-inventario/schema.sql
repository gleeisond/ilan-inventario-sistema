-- ====================================
-- SISTEMA DE INVENTÁRIO ILAN
-- Schema SQL completo para Supabase
-- ====================================
-- Pode rodar quantas vezes precisar no SQL Editor do Supabase:
-- só cria o que ainda não existe e não apaga nenhum dado.

-- ====================================
-- 1. CRIAR EXTENSÕES
-- ====================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================
-- 2. CRIAR ENUM TYPES
-- ====================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'lider_midia',
    'pastor',
    'rodrigo',
    'lider_regional',
    'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE equipment_status AS ENUM (
    'ativo',
    'danificado',
    'em_manutencao',
    'descartado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM (
    'aberto',
    'recebido',
    'em_diagnostico',
    'em_conserto',
    'aguardando_pecas',
    'pronto',
    'entregue',
    'cancelado',
    'aguardando_envio',
    'aguardando_aprovacao',
    'reprovado',
    'aguardando_instalacao',
    'concluido',
    'descartado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM (
    'baixa',
    'media',
    'alta',
    'critica'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE action_type AS ENUM (
    'recebido',
    'diagnosticado',
    'conserto_iniciado',
    'peca_solicitada',
    'peca_recebida',
    'conserto_completo',
    'pronto_para_entrega',
    'entregue',
    'enviado_assistencia',
    'resolvido_no_campus',
    'orcamento_solicitado',
    'orcamento_aprovado',
    'orcamento_reprovado',
    'descartado',
    'devolvido_sem_conserto',
    'retirado_assistencia',
    'instalado',
    'reaberto'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'pronto_para_buscar',
    'pronto',
    'aguardando_pecas',
    'atrasado',
    'nova_requisicao'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'criado',
    'movido',
    'danificado',
    'consertado',
    'responsavel_alterado',
    'status_alterado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ====================================
-- 3. TABELAS PRINCIPAIS
-- ====================================

-- Region (Regiões)
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campus (13 igrejas)
CREATE TABLE IF NOT EXISTS campus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  location TEXT,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  pastor_id UUID,
  lider_midia_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (Autenticação via Supabase Auth, mas com dados adicionais aqui)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  campus_id UUID REFERENCES campus(id) ON DELETE SET NULL,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment (Os "muitoooosssss")
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  category VARCHAR(100),
  value DECIMAL(10, 2),
  purchase_date DATE,
  campus_id UUID NOT NULL REFERENCES campus(id) ON DELETE CASCADE,
  responsible_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status equipment_status DEFAULT 'ativo',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Request (Fluxo de Manutenção)
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campus(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  problem_description TEXT NOT NULL,
  status maintenance_status DEFAULT 'aberto',
  priority priority_level DEFAULT 'media',
  assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_completion_date DATE,
  actual_completion_date DATE,
  cost DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Log (Histórico do trabalho)
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  action_type action_type NOT NULL,
  description TEXT,
  notes TEXT,
  performed_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Notifications (Notificações)
CREATE TABLE IF NOT EXISTS maintenance_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- Equipment History (Auditoria geral)
CREATE TABLE IF NOT EXISTS equipment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  description TEXT,
  changed_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs (o que cada usuário fez no sistema)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50),
  entity_id UUID,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categorias e locais dos equipamentos (o administrador gerencia em Cadastros).
-- equipment.category e equipment.location guardam o nome.
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ====================================

CREATE INDEX IF NOT EXISTS idx_equipment_campus_id ON equipment(campus_id);
CREATE INDEX IF NOT EXISTS idx_equipment_responsible_id ON equipment(responsible_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);

CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_id ON maintenance_requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_campus_id ON maintenance_requests(campus_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_by ON maintenance_requests(created_by_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_assigned_to ON maintenance_requests(assigned_to_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_logs_request_id ON maintenance_logs(maintenance_request_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_performed_by ON maintenance_logs(performed_by_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON maintenance_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON maintenance_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_request ON maintenance_notifications(maintenance_request_id);

CREATE INDEX IF NOT EXISTS idx_equipment_history_equipment_id ON equipment_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_history_changed_by ON equipment_history(changed_by_id);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_campus_id ON users(campus_id);

CREATE INDEX IF NOT EXISTS idx_campus_region ON campus(region_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- ====================================
-- 5. CONSTRAINTS ADICIONAIS
-- ====================================

-- Foreign keys de pastor e lider_midia em campus (users é criada depois de campus)
DO $$ BEGIN
  ALTER TABLE campus
    ADD CONSTRAINT fk_campus_pastor FOREIGN KEY (pastor_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE campus
    ADD CONSTRAINT fk_campus_lider_midia FOREIGN KEY (lider_midia_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Nome de campus único (o seed usa o nome para achar o campus)
DO $$ BEGIN
  ALTER TABLE campus ADD CONSTRAINT campus_name_key UNIQUE (name);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

-- updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE TRIGGER trg_campus_updated_at BEFORE UPDATE ON campus
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_maintenance_updated_at BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ====================================

-- RLS ligado em todas as tabelas expostas pela API do Supabase
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas que consultavam a própria tabela users (erro de recursão)
DROP POLICY IF EXISTS admin_all ON users;
DROP POLICY IF EXISTS admin_all_equipment ON equipment;
DROP POLICY IF EXISTS lider_see_own_campus ON equipment;

-- FASE DE TESTES (login desligado): qualquer visitante do site lê e grava tudo.
-- Quando o login voltar, troque esta política por regras por papel/campus.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['regions', 'campus', 'users', 'equipment', 'maintenance_requests',
                           'maintenance_logs', 'maintenance_notifications', 'equipment_history',
                           'activity_logs', 'categories', 'locations']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname = 'public' AND tablename = t AND policyname = 'acesso_teste') THEN
      EXECUTE format(
        'CREATE POLICY acesso_teste ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;

-- ====================================
-- 7. VIEWS ÚTEIS
-- ====================================
-- security_invoker: as views respeitam o RLS de quem consulta

-- View: Manutenções Pendentes com detalhes
CREATE OR REPLACE VIEW v_pending_maintenance WITH (security_invoker = true) AS
SELECT
  mr.id,
  mr.status,
  mr.priority,
  eq.name as equipment_name,
  c.name as campus_name,
  u.name as requested_by,
  mr.problem_description,
  mr.scheduled_completion_date,
  CURRENT_DATE::DATE - mr.scheduled_completion_date::DATE as days_overdue,
  mr.created_at
FROM maintenance_requests mr
JOIN equipment eq ON mr.equipment_id = eq.id
JOIN campus c ON mr.campus_id = c.id
JOIN users u ON mr.created_by_id = u.id
WHERE mr.status NOT IN ('entregue', 'cancelado')
ORDER BY mr.priority DESC, mr.created_at ASC;

-- View: Equipamentos por Campus
CREATE OR REPLACE VIEW v_equipment_by_campus WITH (security_invoker = true) AS
SELECT
  c.name as campus_name,
  COUNT(eq.id) as total_equipamentos,
  SUM(CASE WHEN eq.status = 'ativo' THEN 1 ELSE 0 END) as ativos,
  SUM(CASE WHEN eq.status = 'em_manutencao' THEN 1 ELSE 0 END) as em_manutencao,
  SUM(CASE WHEN eq.status = 'danificado' THEN 1 ELSE 0 END) as danificados,
  SUM(eq.value) as valor_total
FROM campus c
LEFT JOIN equipment eq ON c.id = eq.campus_id
GROUP BY c.id, c.name;

-- View: Custo de Manutenção por Campus (Mês)
CREATE OR REPLACE VIEW v_maintenance_cost_monthly WITH (security_invoker = true) AS
SELECT
  TO_DATE(TO_CHAR(mr.created_at, 'YYYY-MM'), 'YYYY-MM') as mes,
  c.name as campus_name,
  COUNT(mr.id) as total_manutencoes,
  COALESCE(SUM(mr.cost), 0) as custo_total
FROM maintenance_requests mr
JOIN campus c ON mr.campus_id = c.id
WHERE mr.status = 'entregue'
GROUP BY mes, campus_name
ORDER BY mes DESC;

-- ====================================
-- FIM DO SCHEMA
-- ====================================
