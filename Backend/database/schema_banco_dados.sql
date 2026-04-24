CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_usuario') THEN
    CREATE TYPE tipo_usuario AS ENUM ('participante', 'servidor', 'gestor');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_programa') THEN
    CREATE TYPE tipo_programa AS ENUM ('educacao', 'saude', 'assistencia', 'cultura', 'outro');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_usuario') THEN
    CREATE TYPE status_usuario AS ENUM ('ativo', 'inativo', 'suspenso');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_programa') THEN
    CREATE TYPE status_programa AS ENUM ('planejamento', 'inscricoes_abertas', 'inscricoes_fechadas', 'em_andamento', 'finalizado');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_inscricao') THEN
    CREATE TYPE status_inscricao AS ENUM ('pendente', 'aprovada', 'rejeitada', 'cancelada');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_criterio') THEN
    CREATE TYPE tipo_criterio AS ENUM ('idade', 'renda', 'documento', 'residencia', 'escolaridade', 'outro');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_documento') THEN
    CREATE TYPE tipo_documento AS ENUM ('cpf', 'rg', 'comprovante_renda', 'comprovante_residencia', 'comprovante_escolaridade', 'outro');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_notificacao') THEN
    CREATE TYPE tipo_notificacao AS ENUM ('inscricao_recebida', 'inscricao_aprovada', 'inscricao_rejeitada', 'programa_iniciando', 'lembrete_inscricao', 'outro');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'canal_notificacao') THEN
    CREATE TYPE canal_notificacao AS ENUM ('in_app', 'email', 'webhook');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) UNIQUE,
  telefone VARCHAR(20),
  data_nascimento DATE,
  endereco_rua VARCHAR(255),
  endereco_numero VARCHAR(10),
  endereco_complemento VARCHAR(255),
  endereco_bairro VARCHAR(100),
  endereco_cidade VARCHAR(100),
  endereco_estado CHAR(2),
  endereco_cep VARCHAR(8),
  tipo tipo_usuario NOT NULL,
  status status_usuario DEFAULT 'ativo',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_ultimo_acesso TIMESTAMP,
  CONSTRAINT email_valido CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT cpf_valido CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$')
);

CREATE TABLE IF NOT EXISTS programas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gestor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  objetivo TEXT,
  publico_alvo TEXT,
  tipo tipo_programa NOT NULL,
  data_inicio_inscricao DATE NOT NULL,
  data_fim_inscricao DATE NOT NULL,
  data_inicio_programa DATE NOT NULL,
  data_fim_programa DATE NOT NULL,
  total_vagas INTEGER NOT NULL CHECK (total_vagas > 0),
  vagas_disponiveis INTEGER NOT NULL CHECK (vagas_disponiveis >= 0),
  inscricao_automatica BOOLEAN DEFAULT FALSE,
  status status_programa DEFAULT 'planejamento',
  local_realizacao VARCHAR(255),
  endereco_realizacao TEXT,
  responsavel_nome VARCHAR(255),
  responsavel_contato VARCHAR(255),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT datas_validas CHECK (
    data_inicio_inscricao <= data_fim_inscricao
    AND data_fim_inscricao <= data_inicio_programa
    AND data_inicio_programa <= data_fim_programa
  ),
  CONSTRAINT vagas_consistentes CHECK (vagas_disponiveis <= total_vagas)
);

CREATE TABLE IF NOT EXISTS criterios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  programa_id UUID NOT NULL REFERENCES programas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo tipo_criterio NOT NULL,
  valor_minimo VARCHAR(100),
  valor_maximo VARCHAR(100),
  obrigatorio BOOLEAN DEFAULT TRUE,
  permite_multiplas_respostas BOOLEAN DEFAULT FALSE,
  ordem INTEGER DEFAULT 0,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inscricoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  programa_id UUID NOT NULL REFERENCES programas(id) ON DELETE CASCADE,
  status status_inscricao DEFAULT 'pendente',
  respostas_criterios JSONB DEFAULT '{}'::jsonb,
  motivo_rejeicao TEXT,
  servidor_responsavel_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_aprovacao TIMESTAMP,
  data_rejeicao TIMESTAMP,
  compareceu BOOLEAN,
  data_participacao TIMESTAMP,
  observacoes_participacao TEXT,
  UNIQUE(usuario_id, programa_id)
);

CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  inscricao_id UUID REFERENCES inscricoes(id) ON DELETE SET NULL,
  tipo tipo_documento NOT NULL,
  arquivo_url VARCHAR(255) NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  tamanho_bytes INTEGER,
  mime_type VARCHAR(100),
  verificado BOOLEAN DEFAULT FALSE,
  motivo_rejeicao TEXT,
  servidor_verificador_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_verificacao TIMESTAMP,
  data_expiracao TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo tipo_notificacao NOT NULL,
  canal canal_notificacao NOT NULL DEFAULT 'in_app',
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT,
  programa_id UUID REFERENCES programas(id) ON DELETE SET NULL,
  inscricao_id UUID REFERENCES inscricoes(id) ON DELETE SET NULL,
  referencia_chave VARCHAR(255),
  lido BOOLEAN DEFAULT FALSE,
  entregue BOOLEAN NOT NULL DEFAULT FALSE,
  entregue_em TIMESTAMP,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  tentativas_entrega INTEGER NOT NULL DEFAULT 0,
  erro_ultima_entrega TEXT,
  data_leitura TIMESTAMP,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notificacoes
  ADD COLUMN IF NOT EXISTS canal canal_notificacao NOT NULL DEFAULT 'in_app';

ALTER TABLE notificacoes
  ADD COLUMN IF NOT EXISTS referencia_chave VARCHAR(255);

ALTER TABLE notificacoes
  ADD COLUMN IF NOT EXISTS entregue BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE notificacoes
  ADD COLUMN IF NOT EXISTS entregue_em TIMESTAMP;

ALTER TABLE notificacoes
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE notificacoes
  ADD COLUMN IF NOT EXISTS tentativas_entrega INTEGER NOT NULL DEFAULT 0;

ALTER TABLE notificacoes
  ADD COLUMN IF NOT EXISTS erro_ultima_entrega TEXT;

CREATE TABLE IF NOT EXISTS auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  entidade VARCHAR(100) NOT NULL,
  entidade_id UUID NOT NULL,
  acao VARCHAR(50) NOT NULL,
  descricao TEXT,
  dados_antes JSONB,
  dados_depois JSONB,
  data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_origem VARCHAR(45)
);

CREATE TABLE IF NOT EXISTS sessoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_refresh VARCHAR(500) NOT NULL,
  ip_origem VARCHAR(45),
  user_agent TEXT,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_expiracao TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_data_criacao ON usuarios(data_criacao);

CREATE INDEX IF NOT EXISTS idx_programas_gestor_id ON programas(gestor_id);
CREATE INDEX IF NOT EXISTS idx_programas_status ON programas(status);
CREATE INDEX IF NOT EXISTS idx_programas_tipo ON programas(tipo);
CREATE INDEX IF NOT EXISTS idx_programas_data_inicio_inscricao ON programas(data_inicio_inscricao);
CREATE INDEX IF NOT EXISTS idx_programas_data_fim_inscricao ON programas(data_fim_inscricao);
CREATE INDEX IF NOT EXISTS idx_programas_data_criacao ON programas(data_criacao);

CREATE INDEX IF NOT EXISTS idx_criterios_programa_id ON criterios(programa_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_usuario_id ON inscricoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_programa_id ON inscricoes(programa_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_status ON inscricoes(status);
CREATE INDEX IF NOT EXISTS idx_inscricoes_data_inscricao ON inscricoes(data_inscricao);
CREATE INDEX IF NOT EXISTS idx_inscricoes_servidor_responsavel_id ON inscricoes(servidor_responsavel_id);

CREATE INDEX IF NOT EXISTS idx_documentos_usuario_id ON documentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_documentos_inscricao_id ON documentos(inscricao_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo);
CREATE INDEX IF NOT EXISTS idx_documentos_verificado ON documentos(verificado);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_canal ON notificacoes(canal);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lido ON notificacoes(lido);
CREATE INDEX IF NOT EXISTS idx_notificacoes_data_criacao ON notificacoes(data_criacao);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notificacoes_referencia_unica
  ON notificacoes(usuario_id, canal, referencia_chave)
  WHERE referencia_chave IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidade ON auditoria(entidade);
CREATE INDEX IF NOT EXISTS idx_auditoria_data_acao ON auditoria(data_acao);

CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_id ON sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_data_expiracao ON sessoes(data_expiracao);

CREATE OR REPLACE FUNCTION atualizar_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_usuarios_atualizacao ON usuarios;
CREATE TRIGGER trigger_usuarios_atualizacao
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao();

DROP TRIGGER IF EXISTS trigger_programas_atualizacao ON programas;
CREATE TRIGGER trigger_programas_atualizacao
BEFORE UPDATE ON programas
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE OR REPLACE VIEW vw_estatisticas_programa AS
SELECT
  p.id,
  p.nome AS programa_nome,
  COUNT(i.id) AS total_inscricoes,
  COUNT(CASE WHEN i.status = 'pendente' THEN 1 END) AS inscricoes_pendentes,
  COUNT(CASE WHEN i.status = 'aprovada' THEN 1 END) AS inscricoes_aprovadas,
  COUNT(CASE WHEN i.status = 'rejeitada' THEN 1 END) AS inscricoes_rejeitadas,
  COUNT(CASE WHEN i.status = 'cancelada' THEN 1 END) AS inscricoes_canceladas,
  p.vagas_disponiveis,
  p.total_vagas
FROM programas p
LEFT JOIN inscricoes i ON p.id = i.programa_id
GROUP BY p.id, p.nome, p.vagas_disponiveis, p.total_vagas;

CREATE OR REPLACE VIEW vw_inscricoes_pendentes AS
SELECT
  i.id,
  u.nome AS usuario_nome,
  u.email AS usuario_email,
  p.nome AS programa_nome,
  i.data_inscricao,
  p.data_fim_inscricao,
  u.tipo AS usuario_tipo
FROM inscricoes i
JOIN usuarios u ON i.usuario_id = u.id
JOIN programas p ON i.programa_id = p.id
WHERE i.status = 'pendente'
ORDER BY i.data_inscricao ASC;

CREATE OR REPLACE VIEW vw_programas_abertos AS
SELECT
  p.*,
  COUNT(i.id) AS total_inscritos,
  ROUND((COUNT(i.id)::numeric / NULLIF(p.total_vagas, 0)) * 100, 2) AS percentual_ocupacao
FROM programas p
LEFT JOIN inscricoes i ON p.id = i.programa_id AND i.status = 'aprovada'
WHERE p.status = 'inscricoes_abertas'
  AND CURRENT_DATE BETWEEN p.data_inicio_inscricao AND p.data_fim_inscricao
GROUP BY p.id;

COMMENT ON TABLE usuarios IS 'Armazena todos os usuarios do sistema';
COMMENT ON TABLE programas IS 'Armazena os programas sociais';
COMMENT ON TABLE inscricoes IS 'Armazena as inscricoes dos usuarios em programas';
COMMENT ON TABLE documentos IS 'Armazena os documentos enviados pelos usuarios';
COMMENT ON TABLE notificacoes IS 'Armazena as notificacoes enviadas aos usuarios';
COMMENT ON TABLE auditoria IS 'Log de acoes importantes do sistema';
COMMENT ON TABLE sessoes IS 'Armazena sessoes ativas e refresh tokens';
