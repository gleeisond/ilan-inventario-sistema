-- Rodar uma vez no SQL Editor do Supabase (só acrescenta opções, não apaga nada)
-- Etapas do fluxo de reparo: triagem do líder regional, aprovação de orçamento pelo ADM,
-- descarte e instalação de volta no campus

ALTER TYPE maintenance_status ADD VALUE IF NOT EXISTS 'aguardando_envio';
ALTER TYPE maintenance_status ADD VALUE IF NOT EXISTS 'aguardando_aprovacao';
ALTER TYPE maintenance_status ADD VALUE IF NOT EXISTS 'reprovado';
ALTER TYPE maintenance_status ADD VALUE IF NOT EXISTS 'aguardando_instalacao';
ALTER TYPE maintenance_status ADD VALUE IF NOT EXISTS 'concluido';
ALTER TYPE maintenance_status ADD VALUE IF NOT EXISTS 'descartado';

ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'enviado_assistencia';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'resolvido_no_campus';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'orcamento_solicitado';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'orcamento_aprovado';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'orcamento_reprovado';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'descartado';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'devolvido_sem_conserto';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'retirado_assistencia';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'instalado';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'reaberto';
