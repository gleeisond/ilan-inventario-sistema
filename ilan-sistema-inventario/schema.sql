-- ====================================
-- SISTEMA DE INVENTÁRIO ILAN
-- Schema SQL completo para Supabase
-- ====================================

-- ====================================
-- 1. CRIAR EXTENSÕES
-- ====================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================
-- 2. CRIAR ENUM TYPES
-- ====================================

CREATE TYPE user_role AS ENUM (
  'lider_midia',
  'pastor',
  'rodrigo',
  'lider_regional',
  'admin'
);

CREATE TYPE equipment_status AS ENUM (
  'ativo',
  'danificado',
  'em_manutencao',
  'descartado'
);

CREATE TYPE maintenance_status AS ENUM (
  'aberto',
  'recebido',
  'em_diagnostico',
  'em_conserto',
  'aguardando_pecas',
  'pronto',
  'entregue',
  'cancelado'
);

CREATE TYPE priority_level AS ENUM (
  'baixa',
  'media',
  'alta',
  'critica'
);

CREATE TYPE action_type AS ENUM (
  'recebido',
  'diagnosticado',
  'conserto_iniciado',
  'peca_solicitada',
  'peca_recebida',
  'conserto_completo',
  'pronto_para_entrega',
  'entregue'
);

CREATE TYPE notification_type AS ENUM (
  'pronto_para_buscar',
  'pronto',
  'aguardando_pecas',
  'atrasado',
  'nova_requisicao'
);

CREATE TYPE event_type AS ENUM (
  'criado',
  'movido',
  'danificado',
  'consertado',
  'responsavel_alterado',
  'status_alterado'
);

-- ====================================
-- 3. TABELAS PRINCIPAIS
-- ====================================

-- Region (Regiões)
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campus (13 igrejas)
CREATE TABLE campus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  location TEXT,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  pastor_id UUID,
  lider_midia_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (Autenticação via Supabase Auth, mas com dados adicionais aqui)
CREATE TABLE users (
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
CREATE TABLE equipment (
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
CREATE TABLE maintenance_requests (
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
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  action_type action_type NOT NULL,
  description TEXT,
  notes TEXT,
  performed_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Notifications (Notificações)
CREATE TABLE maintenance_notifications (
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
CREATE TABLE equipment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  description TEXT,
  changed_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ====================================

CREATE INDEX idx_equipment_campus_id ON equipment(campus_id);
CREATE INDEX idx_equipment_responsible_id ON equipment(responsible_id);
CREATE INDEX idx_equipment_status ON equipment(status);

CREATE INDEX idx_maintenance_equipment_id ON maintenance_requests(equipment_id);
CREATE INDEX idx_maintenance_campus_id ON maintenance_requests(campus_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_created_by ON maintenance_requests(created_by_id);
CREATE INDEX idx_maintenance_assigned_to ON maintenance_requests(assigned_to_id);

CREATE INDEX idx_maintenance_logs_request_id ON maintenance_logs(maintenance_request_id);
CREATE INDEX idx_maintenance_logs_performed_by ON maintenance_logs(performed_by_id);

CREATE INDEX idx_notifications_recipient ON maintenance_notifications(recipient_id);
CREATE INDEX idx_notifications_is_read ON maintenance_notifications(is_read);
CREATE INDEX idx_notifications_request ON maintenance_notifications(maintenance_request_id);

CREATE INDEX idx_equipment_history_equipment_id ON equipment_history(equipment_id);
CREATE INDEX idx_equipment_history_changed_by ON equipment_history(changed_by_id);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_campus_id ON users(campus_id);

CREATE INDEX idx_campus_region ON campus(region_id);

-- ====================================
-- 5. CONSTRAINTS ADICIONAIS
-- ====================================

-- Corrigir foreign keys de pastor e lider_midia em campus
ALTER TABLE campus
ADD CONSTRAINT fk_campus_pastor FOREIGN KEY (pastor_id) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_campus_lider_midia FOREIGN KEY (lider_midia_id) REFERENCES users(id) ON DELETE SET NULL;

-- ====================================
-- 6. INSERIR DADOS INICIAIS (OPCIONAL)
-- ====================================

-- Inserir regiões (você pode ajustar depois)
-- INSERT INTO regions (name, description) VALUES
-- ('Região Metropolitana', 'Região de Rio de Janeiro'),
-- ('Região Interior', 'Região do interior RJ'),
-- ('Litoral', 'Região do litoral');

-- ====================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ====================================

-- Habilitar RLS nas tabelas sensíveis
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (você vai detalhar depois)
-- Admin vê tudo
CREATE POLICY admin_all ON users AS (true)
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY admin_all_equipment ON equipment AS (true)
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Líderes veem equipamentos do seu campus
CREATE POLICY lider_see_own_campus ON equipment
  USING (campus_id IN (
    SELECT campus_id FROM users WHERE id = auth.uid()
  ) OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ====================================
-- 8. VIEWS ÚTEIS
-- ====================================

-- View: Manutenções Pendentes com detalhes
CREATE VIEW v_pending_maintenance AS
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
CREATE VIEW v_equipment_by_campus AS
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
CREATE VIEW v_maintenance_cost_monthly AS
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
