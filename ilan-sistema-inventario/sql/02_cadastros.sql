-- Rodar uma vez no SQL Editor do Supabase (só cria e preenche, não apaga nada)
-- Tabelas de categorias e locais que o administrador gerencia na tela Cadastros

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

-- Começa com as categorias que já existiam no sistema e as que estão nos equipamentos
INSERT INTO categories (name)
SELECT unnest(ARRAY['câmera', 'áudio', 'projetor', 'luz', 'computador', 'cabo', 'tripé', 'outro'])
ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name)
SELECT DISTINCT category FROM equipment WHERE category IS NOT NULL AND trim(category) <> ''
ON CONFLICT (name) DO NOTHING;

-- Começa com os locais já usados nos equipamentos
INSERT INTO locations (name)
SELECT DISTINCT location FROM equipment WHERE location IS NOT NULL AND trim(location) <> ''
ON CONFLICT (name) DO NOTHING;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_teste ON categories;
CREATE POLICY acesso_teste ON categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS acesso_teste ON locations;
CREATE POLICY acesso_teste ON locations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
