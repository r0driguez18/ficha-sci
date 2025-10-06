-- =====================================================
-- SCHEMA SQL SERVER
-- =====================================================
-- Este ficheiro contém o schema adaptado para SQL Server
-- =====================================================

-- =====================================================
-- TABELAS
-- =====================================================

-- Tabela: file_processes
CREATE TABLE file_processes (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  date_registered DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
  time_registered TIME NOT NULL,
  created_at DATETIME2 DEFAULT GETDATE(),
  is_salary BIT DEFAULT 0,
  task NVARCHAR(MAX) NOT NULL,
  as400_name NVARCHAR(MAX),
  operation_number NVARCHAR(MAX),
  executed_by NVARCHAR(MAX),
  tipo NVARCHAR(MAX)
);

-- Tabela: daily_alerts
CREATE TABLE daily_alerts (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  alert_time TIME NOT NULL,
  is_active BIT NOT NULL DEFAULT 1,
  days_of_week NVARCHAR(MAX) NOT NULL DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]',
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  alert_name NVARCHAR(MAX) NOT NULL,
  description NVARCHAR(MAX)
);

-- Tabela: taskboard_data
CREATE TABLE taskboard_data (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id NVARCHAR(450) NOT NULL,
  form_type NVARCHAR(MAX) NOT NULL,
  date NVARCHAR(MAX) NOT NULL,
  turn_data NVARCHAR(MAX) NOT NULL,
  tasks NVARCHAR(MAX) NOT NULL,
  table_rows NVARCHAR(MAX) NOT NULL,
  active_tab NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT UQ_taskboard_data UNIQUE(user_id, form_type, date)
);

-- Tabela: exported_taskboards
CREATE TABLE exported_taskboards (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id NVARCHAR(450) NOT NULL,
  form_type NVARCHAR(MAX) NOT NULL,
  date NVARCHAR(MAX) NOT NULL,
  exported_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  turn_data NVARCHAR(MAX) NOT NULL,
  tasks NVARCHAR(MAX) NOT NULL,
  table_rows NVARCHAR(MAX) NOT NULL,
  pdf_signature NVARCHAR(MAX) NOT NULL,
  file_name NVARCHAR(MAX) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Tabela: cobrancas_retornos
CREATE TABLE cobrancas_retornos (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id NVARCHAR(450) NOT NULL,
  data_aplicacao DATE NOT NULL,
  data_retorno_esperada DATE NOT NULL,
  ficheiro_nome NVARCHAR(MAX) NOT NULL,
  retorno_enviado BIT NOT NULL DEFAULT 0,
  data_retorno_enviado DATE,
  observacoes NVARCHAR(MAX),
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Tabela: users (para autenticação - substituir auth.users do Supabase)
CREATE TABLE users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(255) NOT NULL UNIQUE,
  password_hash NVARCHAR(MAX) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  last_sign_in_at DATETIME2
);

-- =====================================================
-- VIEWS
-- =====================================================

-- View: salary_processes
GO
CREATE VIEW salary_processes AS
SELECT 
  id,
  date_registered,
  time_registered,
  created_at,
  is_salary,
  task,
  as400_name,
  operation_number,
  executed_by
FROM file_processes
WHERE is_salary = 1;
GO

-- =====================================================
-- TRIGGERS PARA updated_at
-- =====================================================

-- Trigger para daily_alerts
GO
CREATE TRIGGER trg_daily_alerts_updated_at
ON daily_alerts
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE daily_alerts
  SET updated_at = GETDATE()
  FROM daily_alerts da
  INNER JOIN inserted i ON da.id = i.id;
END;
GO

-- Trigger para taskboard_data
GO
CREATE TRIGGER trg_taskboard_data_updated_at
ON taskboard_data
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE taskboard_data
  SET updated_at = GETDATE()
  FROM taskboard_data td
  INNER JOIN inserted i ON td.id = i.id;
END;
GO

-- Trigger para exported_taskboards
GO
CREATE TRIGGER trg_exported_taskboards_updated_at
ON exported_taskboards
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE exported_taskboards
  SET updated_at = GETDATE()
  FROM exported_taskboards et
  INNER JOIN inserted i ON et.id = i.id;
END;
GO

-- Trigger para cobrancas_retornos
GO
CREATE TRIGGER trg_cobrancas_retornos_updated_at
ON cobrancas_retornos
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE cobrancas_retornos
  SET updated_at = GETDATE()
  FROM cobrancas_retornos cr
  INNER JOIN inserted i ON cr.id = i.id;
END;
GO

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_file_processes_date ON file_processes(date_registered);
CREATE INDEX idx_file_processes_is_salary ON file_processes(is_salary);
CREATE INDEX idx_file_processes_tipo ON file_processes(tipo);

CREATE INDEX idx_taskboard_data_user_id ON taskboard_data(user_id);
CREATE INDEX idx_taskboard_data_form_type ON taskboard_data(form_type);

CREATE INDEX idx_exported_taskboards_user_id ON exported_taskboards(user_id);
CREATE INDEX idx_exported_taskboards_exported_at ON exported_taskboards(exported_at);

CREATE INDEX idx_cobrancas_retornos_user_id ON cobrancas_retornos(user_id);
CREATE INDEX idx_cobrancas_retornos_data_retorno ON cobrancas_retornos(data_retorno_esperada);
CREATE INDEX idx_cobrancas_retornos_enviado ON cobrancas_retornos(retorno_enviado);

CREATE INDEX idx_users_email ON users(email);

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. SQL Server não tem RLS (Row Level Security) nativo como PostgreSQL
--    A segurança deve ser implementada na camada da aplicação
--
-- 2. Não há equivalente direto ao auth.uid() do Supabase
--    O user_id terá de ser gerido pela aplicação
--
-- 3. JSONB do PostgreSQL foi substituído por NVARCHAR(MAX)
--    Os dados JSON podem ser armazenados como strings
--    Use JSON_VALUE() e JSON_QUERY() para ler dados
--
-- 4. A autenticação terá de ser implementada do zero
--    A tabela 'users' é apenas um exemplo básico
--
-- 5. Para storage de ficheiros, terá de usar outra solução
--    (Azure Blob Storage, sistema de ficheiros, etc.)
