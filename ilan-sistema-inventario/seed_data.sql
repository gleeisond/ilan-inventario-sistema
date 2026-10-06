-- seed_data.sql
-- Dados iniciais para testes do Sistema ILAN
-- Execute APÓS rodar o schema principal

-- ====================================
-- 1. INSERIR REGIÕES
-- ====================================

INSERT INTO regions (name, description) VALUES
('Metropolitana', 'Região de Rio de Janeiro'),
('Litoral', 'Região do Litoral Fluminense'),
('Interior', 'Região do Interior')
ON CONFLICT DO NOTHING;

-- ====================================
-- 2. INSERIR CAMPUS (13 igrejas)
-- ====================================

INSERT INTO campus (name, location, region_id) VALUES
('Recreio', 'Avenida Recreio, Rio de Janeiro', (SELECT id FROM regions WHERE name = 'Metropolitana')),
('Niterói', 'Centro, Niterói', (SELECT id FROM regions WHERE name = 'Metropolitana')),
('Arena', 'Bairro da Arena, Rio de Janeiro', (SELECT id FROM regions WHERE name = 'Metropolitana')),
('Freguesia', 'Avenida Freguesia, Rio de Janeiro', (SELECT id FROM regions WHERE name = 'Metropolitana')),
('Vila da Penha', 'Vila da Penha, Rio de Janeiro', (SELECT id FROM regions WHERE name = 'Metropolitana')),
('Online', 'Transmissão Online', (SELECT id FROM regions WHERE name = 'Metropolitana')),
('Bangu', 'Bangu, Rio de Janeiro', (SELECT id FROM regions WHERE name = 'Metropolitana')),
('Itaguaí', 'Centro, Itaguaí', (SELECT id FROM regions WHERE name = 'Litoral')),
('Taquara', 'Taquara, Rio de Janeiro', (SELECT id FROM regions WHERE name = 'Interior')),
('Cachambi', 'Cachambi, Rio de Janeiro', (SELECT id FROM regions WHERE name = 'Metropolitana')),
('Araruama', 'Centro, Araruama', (SELECT id FROM regions WHERE name = 'Litoral')),
('Campo Grande', 'Campo Grande, Rio de Janeiro', (SELECT id FROM regions WHERE name = 'Metropolitana')),
('Barra da Tijuca', 'Barra da Tijuca, Rio de Janeiro', (SELECT id FROM regions WHERE name = 'Metropolitana'))
ON CONFLICT DO NOTHING;

-- ====================================
-- 3. INSERIR USUÁRIOS INICIAIS
-- ====================================

-- Admin
INSERT INTO users (id, email, name, role, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@ilan.com.br', 'Admin Ilan', 'admin', true)
ON CONFLICT DO NOTHING;

-- Rodrigo (Ilan Tech Pro)
INSERT INTO users (id, email, name, role, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'rodrigo@ilantechpro.com.br', 'Rodrigo - Ilan Tech Pro', 'rodrigo', true)
ON CONFLICT DO NOTHING;

-- Líderes Regionais
INSERT INTO users (id, email, name, role, region_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'lider.metro@ilan.com.br', 'Líder Regional - Metropolitana', 'lider_regional', (SELECT id FROM regions WHERE name = 'Metropolitana'), true),
('550e8400-e29b-41d4-a716-446655440004', 'lider.litoral@ilan.com.br', 'Líder Regional - Litoral', 'lider_regional', (SELECT id FROM regions WHERE name = 'Litoral'), true),
('550e8400-e29b-41d4-a716-446655440005', 'lider.interior@ilan.com.br', 'Líder Regional - Interior', 'lider_regional', (SELECT id FROM regions WHERE name = 'Interior'), true)
ON CONFLICT DO NOTHING;

-- Líderes de Mídia + Pastores (por campus)
-- Recreio
INSERT INTO users (id, email, name, role, campus_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'lider.recreio@ilan.com.br', 'Líder Mídia - Recreio', 'lider_midia', (SELECT id FROM campus WHERE name = 'Recreio'), true),
('550e8400-e29b-41d4-a716-446655440011', 'pastor.recreio@ilan.com.br', 'Pastor - Recreio', 'pastor', (SELECT id FROM campus WHERE name = 'Recreio'), true)
ON CONFLICT DO NOTHING;

-- Niterói
INSERT INTO users (id, email, name, role, campus_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440012', 'lider.niteroi@ilan.com.br', 'Líder Mídia - Niterói', 'lider_midia', (SELECT id FROM campus WHERE name = 'Niterói'), true),
('550e8400-e29b-41d4-a716-446655440013', 'pastor.niteroi@ilan.com.br', 'Pastor - Niterói', 'pastor', (SELECT id FROM campus WHERE name = 'Niterói'), true)
ON CONFLICT DO NOTHING;

-- Arena
INSERT INTO users (id, email, name, role, campus_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440014', 'lider.arena@ilan.com.br', 'Líder Mídia - Arena', 'lider_midia', (SELECT id FROM campus WHERE name = 'Arena'), true),
('550e8400-e29b-41d4-a716-446655440015', 'pastor.arena@ilan.com.br', 'Pastor - Arena', 'pastor', (SELECT id FROM campus WHERE name = 'Arena'), true)
ON CONFLICT DO NOTHING;

-- Freguesia
INSERT INTO users (id, email, name, role, campus_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440016', 'lider.freguesia@ilan.com.br', 'Líder Mídia - Freguesia', 'lider_midia', (SELECT id FROM campus WHERE name = 'Freguesia'), true),
('550e8400-e29b-41d4-a716-446655440017', 'pastor.freguesia@ilan.com.br', 'Pastor - Freguesia', 'pastor', (SELECT id FROM campus WHERE name = 'Freguesia'), true)
ON CONFLICT DO NOTHING;

-- Vila da Penha
INSERT INTO users (id, email, name, role, campus_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440018', 'lider.vp@ilan.com.br', 'Líder Mídia - Vila da Penha', 'lider_midia', (SELECT id FROM campus WHERE name = 'Vila da Penha'), true),
('550e8400-e29b-41d4-a716-446655440019', 'pastor.vp@ilan.com.br', 'Pastor - Vila da Penha', 'pastor', (SELECT id FROM campus WHERE name = 'Vila da Penha'), true)
ON CONFLICT DO NOTHING;

-- Online
INSERT INTO users (id, email, name, role, campus_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'lider.online@ilan.com.br', 'Líder Mídia - Online', 'lider_midia', (SELECT id FROM campus WHERE name = 'Online'), true),
('550e8400-e29b-41d4-a716-446655440021', 'pastor.online@ilan.com.br', 'Pastor - Online', 'pastor', (SELECT id FROM campus WHERE name = 'Online'), true)
ON CONFLICT DO NOTHING;

-- Bangu
INSERT INTO users (id, email, name, role, campus_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440022', 'lider.bangu@ilan.com.br', 'Líder Mídia - Bangu', 'lider_midia', (SELECT id FROM campus WHERE name = 'Bangu'), true),
('550e8400-e29b-41d4-a716-446655440023', 'pastor.bangu@ilan.com.br', 'Pastor - Bangu', 'pastor', (SELECT id FROM campus WHERE name = 'Bangu'), true)
ON CONFLICT DO NOTHING;

-- Itaguaí
INSERT INTO users (id, email, name, role, campus_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440024', 'lider.itaguai@ilan.com.br', 'Líder Mídia - Itaguaí', 'lider_midia', (SELECT id FROM campus WHERE name = 'Itaguaí'), true),
('550e8400-e29b-41d4-a716-446655440025', 'pastor.itaguai@ilan.com.br', 'Pastor - Itaguaí', 'pastor', (SELECT id FROM campus WHERE name = 'Itaguaí'), true)
ON CONFLICT DO NOTHING;

-- Taquara
INSERT INTO users (id, email, name, role, campus_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440026', 'lider.taquara@ilan.com.br', 'Líder Mídia - Taquara', 'lider_midia', (SELECT id FROM campus WHERE name = 'Taquara'), true),
('550e8400-e29b-41d4-a716-446655440027', 'pastor.taquara@ilan.com.br', 'Pastor - Taquara', 'pastor', (SELECT id FROM campus WHERE name = 'Taquara'), true)
ON CONFLICT DO NOTHING;

-- Cachambi
INSERT INTO users (id, email, name, role, campus_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440028', 'lider.cachambi@ilan.com.br', 'Líder Mídia - Cachambi', 'lider_midia', (SELECT id FROM campus WHERE name = 'Cachambi'), true),
('550e8400-e29b-41d4-a716-446655440029', 'pastor.cachambi@ilan.com.br', 'Pastor - Cachambi', 'pastor', (SELECT id FROM campus WHERE name = 'Cachambi'), true)
ON CONFLICT DO NOTHING;

-- Araruama
INSERT INTO users (id, email, name, role, campus_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440030', 'lider.araruama@ilan.com.br', 'Líder Mídia - Araruama', 'lider_midia', (SELECT id FROM campus WHERE name = 'Araruama'), true),
('550e8400-e29b-41d4-a716-446655440031', 'pastor.araruama@ilan.com.br', 'Pastor - Araruama', 'pastor', (SELECT id FROM campus WHERE name = 'Araruama'), true)
ON CONFLICT DO NOTHING;

-- Campo Grande
INSERT INTO users (id, email, name, role, campus_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440032', 'lider.cg@ilan.com.br', 'Líder Mídia - Campo Grande', 'lider_midia', (SELECT id FROM campus WHERE name = 'Campo Grande'), true),
('550e8400-e29b-41d4-a716-446655440033', 'pastor.cg@ilan.com.br', 'Pastor - Campo Grande', 'pastor', (SELECT id FROM campus WHERE name = 'Campo Grande'), true)
ON CONFLICT DO NOTHING;

-- Barra da Tijuca
INSERT INTO users (id, email, name, role, campus_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440034', 'lider.barra@ilan.com.br', 'Líder Mídia - Barra da Tijuca', 'lider_midia', (SELECT id FROM campus WHERE name = 'Barra da Tijuca'), true),
('550e8400-e29b-41d4-a716-446655440035', 'pastor.barra@ilan.com.br', 'Pastor - Barra da Tijuca', 'pastor', (SELECT id FROM campus WHERE name = 'Barra da Tijuca'), true)
ON CONFLICT DO NOTHING;

-- ====================================
-- 4. INSERIR EQUIPAMENTOS FAKE
-- ====================================

-- Equipamentos Recreio
INSERT INTO equipment (name, brand, category, value, purchase_date, campus_id, responsible_id, status, location) VALUES
('Câmera Sony a6700', 'Sony', 'câmera', 8500.00, '2024-01-15', (SELECT id FROM campus WHERE name = 'Recreio'), (SELECT id FROM users WHERE email = 'lider.recreio@ilan.com.br'), 'ativo', 'Palco principal'),
('Áudio Yamaha MG16XU', 'Yamaha', 'áudio', 3200.00, '2023-06-20', (SELECT id FROM campus WHERE name = 'Recreio'), (SELECT id FROM users WHERE email = 'lider.recreio@ilan.com.br'), 'ativo', 'Sala de técnica'),
('Projetor Epson EB-2250U', 'Epson', 'projetor', 12000.00, '2023-03-10', (SELECT id FROM campus WHERE name = 'Recreio'), (SELECT id FROM users WHERE email = 'lider.recreio@ilan.com.br'), 'em_manutencao', 'Auditório'),
('Iluminação LED RGB', 'Generic', 'luz', 2500.00, '2024-02-05', (SELECT id FROM campus WHERE name = 'Recreio'), (SELECT id FROM users WHERE email = 'lider.recreio@ilan.com.br'), 'ativo', 'Palco principal')
ON CONFLICT DO NOTHING;

-- Equipamentos Niterói
INSERT INTO equipment (name, brand, category, value, purchase_date, campus_id, responsible_id, status, location) VALUES
('Câmera Canon R5', 'Canon', 'câmera', 9200.00, '2024-03-12', (SELECT id FROM campus WHERE name = 'Niterói'), (SELECT id FROM users WHERE email = 'lider.niteroi@ilan.com.br'), 'ativo', 'Palco'),
('Mixer Behringer X32', 'Behringer', 'áudio', 4500.00, '2023-08-22', (SELECT id FROM campus WHERE name = 'Niterói'), (SELECT id FROM users WHERE email = 'lider.niteroi@ilan.com.br'), 'ativo', 'Cabine de técnica')
ON CONFLICT DO NOTHING;

-- Equipamentos Arena
INSERT INTO equipment (name, brand, category, value, purchase_date, campus_id, responsible_id, status, location) VALUES
('Câmera Panasonic GH6', 'Panasonic', 'câmera', 7800.00, '2024-04-01', (SELECT id FROM campus WHERE name = 'Arena'), (SELECT id FROM users WHERE email = 'lider.arena@ilan.com.br'), 'ativo', 'Cobertura lateral'),
('Computador Streaming', 'Dell', 'computador', 6000.00, '2023-11-15', (SELECT id FROM campus WHERE name = 'Arena'), (SELECT id FROM users WHERE email = 'lider.arena@ilan.com.br'), 'danificado', 'Sala de controle')
ON CONFLICT DO NOTHING;

-- Equipamentos Cachambi
INSERT INTO equipment (name, brand, category, value, purchase_date, campus_id, responsible_id, status, location) VALUES
('Câmera Sony a6400', 'Sony', 'câmera', 7200.00, '2024-01-20', (SELECT id FROM campus WHERE name = 'Cachambi'), (SELECT id FROM users WHERE email = 'lider.cachambi@ilan.com.br'), 'ativo', 'Principal'),
('Mesa de som Soundcraft', 'Soundcraft', 'áudio', 5500.00, '2023-07-10', (SELECT id FROM campus WHERE name = 'Cachambi'), (SELECT id FROM users WHERE email = 'lider.cachambi@ilan.com.br'), 'ativo', 'Cabine'),
('Projetor Optoma', 'Optoma', 'projetor', 8000.00, '2023-12-05', (SELECT id FROM campus WHERE name = 'Cachambi'), (SELECT id FROM users WHERE email = 'lider.cachambi@ilan.com.br'), 'em_manutencao', 'Auditório')
ON CONFLICT DO NOTHING;

-- Equipamentos Araruama
INSERT INTO equipment (name, brand, category, value, purchase_date, campus_id, responsible_id, status, location) VALUES
('Câmera Fujifilm X-S20', 'Fujifilm', 'câmera', 5500.00, '2024-02-28', (SELECT id FROM campus WHERE name = 'Araruama'), (SELECT id FROM users WHERE email = 'lider.araruama@ilan.com.br'), 'ativo', 'Frente'),
('Áudio Bose SoundLink', 'Bose', 'áudio', 3800.00, '2023-09-14', (SELECT id FROM campus WHERE name = 'Araruama'), (SELECT id FROM users WHERE email = 'lider.araruama@ilan.com.br'), 'ativo', 'Entrada')
ON CONFLICT DO NOTHING;

-- ====================================
-- 5. INSERIR REQUISIÇÕES DE MANUTENÇÃO FAKE
-- ====================================

-- Manutenção aberta
INSERT INTO maintenance_requests (equipment_id, campus_id, created_by_id, problem_description, status, priority, assigned_to_id, scheduled_completion_date, notes) VALUES
((SELECT id FROM equipment WHERE name = 'Projetor Epson EB-2250U' LIMIT 1), 
 (SELECT id FROM campus WHERE name = 'Recreio'), 
 (SELECT id FROM users WHERE email = 'lider.recreio@ilan.com.br'),
 'Projetor não liga, mostra erro de lâmpada',
 'recebido',
 'alta',
 (SELECT id FROM users WHERE email = 'rodrigo@ilantechpro.com.br'),
 CURRENT_DATE + INTERVAL '3 days',
 'Possível troca de lâmpada necessária')
ON CONFLICT DO NOTHING;

-- Manutenção em progresso
INSERT INTO maintenance_requests (equipment_id, campus_id, created_by_id, problem_description, status, priority, assigned_to_id, scheduled_completion_date, notes) VALUES
((SELECT id FROM equipment WHERE name = 'Computador Streaming' LIMIT 1), 
 (SELECT id FROM campus WHERE name = 'Arena'), 
 (SELECT id FROM users WHERE email = 'lider.arena@ilan.com.br'),
 'Computador desligando aleatoriamente durante transmissão',
 'em_conserto',
 'critica',
 (SELECT id FROM users WHERE email = 'rodrigo@ilantechpro.com.br'),
 CURRENT_DATE + INTERVAL '2 days',
 'Pode ser superaquecimento')
ON CONFLICT DO NOTHING;

-- Manutenção aguardando peça
INSERT INTO maintenance_requests (equipment_id, campus_id, created_by_id, problem_description, status, priority, assigned_to_id, scheduled_completion_date, notes) VALUES
((SELECT id FROM equipment WHERE name = 'Projetor Optoma' LIMIT 1), 
 (SELECT id FROM campus WHERE name = 'Cachambi'), 
 (SELECT id FROM users WHERE email = 'lider.cachambi@ilan.com.br'),
 'Lente com problema de foco automático',
 'aguardando_pecas',
 'media',
 (SELECT id FROM users WHERE email = 'rodrigo@ilantechpro.com.br'),
 CURRENT_DATE + INTERVAL '5 days',
 'Aguardando peça de reposição')
ON CONFLICT DO NOTHING;

-- ====================================
-- 6. LOGS DE MANUTENÇÃO
-- ====================================

INSERT INTO maintenance_logs (maintenance_request_id, action_type, description, performed_by_id) VALUES
((SELECT id FROM maintenance_requests WHERE problem_description = 'Projetor não liga, mostra erro de lâmpada' LIMIT 1),
 'recebido',
 'Equipamento recebido na Ilan Tech Pro em bom estado',
 (SELECT id FROM users WHERE email = 'rodrigo@ilantechpro.com.br'))
ON CONFLICT DO NOTHING;

INSERT INTO maintenance_logs (maintenance_request_id, action_type, description, performed_by_id) VALUES
((SELECT id FROM maintenance_requests WHERE problem_description = 'Computador desligando aleatoriamente durante transmissão' LIMIT 1),
 'diagnosticado',
 'Diagnosticado: Ventilador com travamento, causando superaquecimento',
 (SELECT id FROM users WHERE email = 'rodrigo@ilantechpro.com.br'))
ON CONFLICT DO NOTHING;

INSERT INTO maintenance_logs (maintenance_request_id, action_type, description, performed_by_id) VALUES
((SELECT id FROM maintenance_requests WHERE problem_description = 'Computador desligando aleatoriamente durante transmissão' LIMIT 1),
 'conserto_iniciado',
 'Iniciado limpeza do ventilador e reaplic ação de pasta térmica',
 (SELECT id FROM users WHERE email = 'rodrigo@ilantechpro.com.br'))
ON CONFLICT DO NOTHING;

-- ====================================
-- FIM DO SEED DATA
-- ====================================
