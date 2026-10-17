-- Rodar uma vez no SQL Editor do Supabase (só cria, não apaga nada)
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
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_teste ON activity_logs;
CREATE POLICY acesso_teste ON activity_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
