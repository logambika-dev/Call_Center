CREATE TABLE IF NOT EXISTS templates (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) NOT NULL UNIQUE,
  category        VARCHAR(100) NOT NULL,
  description     TEXT         NOT NULL,
  system_prompt   TEXT         NOT NULL,
  first_message   TEXT         NOT NULL,
  language        VARCHAR(10)  NOT NULL DEFAULT 'en',
  llm_model       VARCHAR(100) NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
  preview_tags    TEXT[]       NOT NULL DEFAULT '{}',
  icon_emoji      VARCHAR(10),
  is_featured     BOOLEAN      NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) NOT NULL,
  mode            VARCHAR(50)  NOT NULL CHECK (mode IN ('autopilot','copilot','template')),
  status          VARCHAR(50)  NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft','active','paused','archived')),
  system_prompt   TEXT         NOT NULL DEFAULT '',
  first_message   TEXT         NOT NULL DEFAULT '',
  voice_id        VARCHAR(255),
  language        VARCHAR(10)  NOT NULL DEFAULT 'en',
  llm_model       VARCHAR(100) NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
  llm_temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7,
  llm_max_tokens  INTEGER      NOT NULL DEFAULT 1024,
  template_id     UUID         REFERENCES templates(id) ON DELETE SET NULL,
  metadata        JSONB        NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status  ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_mode    ON agents(mode);

CREATE TABLE IF NOT EXISTS agent_variables (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID         NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  variable_key  VARCHAR(100) NOT NULL,
  description   VARCHAR(255),
  default_val   VARCHAR(500),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, variable_key)
);

CREATE INDEX IF NOT EXISTS idx_agent_variables_agent_id ON agent_variables(agent_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agents_updated_at ON agents;
CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
