CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('MANAGER', 'OPERATOR', 'CITIZEN')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS citizens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(160) NOT NULL,
  cpf CHAR(11) NOT NULL UNIQUE,
  nis CHAR(11) UNIQUE,
  email VARCHAR(160),
  phone VARCHAR(20),
  family_income NUMERIC(12, 2) NOT NULL CHECK (family_income >= 0),
  household_size INTEGER NOT NULL CHECK (household_size >= 1),
  area_type VARCHAR(10) NOT NULL CHECK (area_type IN ('URBAN', 'RURAL')),
  street VARCHAR(160) NOT NULL,
  number VARCHAR(20),
  neighborhood VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL,
  state CHAR(2) NOT NULL,
  postal_code CHAR(8),
  notes TEXT,
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  benefit_type VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
  application_start_date DATE NOT NULL,
  application_end_date DATE NOT NULL,
  program_start_date DATE,
  program_end_date DATE,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_eligibility_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL UNIQUE REFERENCES social_programs(id) ON DELETE CASCADE,
  max_family_income NUMERIC(12, 2),
  requires_nis BOOLEAN NOT NULL DEFAULT FALSE,
  requires_city_residence BOOLEAN NOT NULL DEFAULT TRUE,
  min_household_size INTEGER,
  allowed_area_types TEXT[] NOT NULL DEFAULT ARRAY['URBAN', 'RURAL'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES social_programs(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  submitted_by_user_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'DELIVERED')),
  eligibility_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  analysis_notes TEXT,
  analyzed_by_user_id UUID REFERENCES users(id),
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, citizen_id)
);

CREATE TABLE IF NOT EXISTS application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type VARCHAR(80) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  verified_by_user_id UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS benefit_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  delivered_by_user_id UUID NOT NULL REFERENCES users(id),
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  receipt_code VARCHAR(50),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id),
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID,
  action VARCHAR(80) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citizens_neighborhood ON citizens (neighborhood);
CREATE INDEX IF NOT EXISTS idx_citizens_area_type ON citizens (area_type);
CREATE INDEX IF NOT EXISTS idx_programs_status ON social_programs (status);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_program_id ON applications (program_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
