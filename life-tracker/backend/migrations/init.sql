-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Habits
CREATE TABLE IF NOT EXISTS habits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    name            VARCHAR(120) NOT NULL,
    description     TEXT,
    frequency       VARCHAR(20) NOT NULL DEFAULT 'daily',
    target_count    INT NOT NULL DEFAULT 1,
    color           VARCHAR(20),
    icon            VARCHAR(10),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_habits_user ON habits(user_id) WHERE deleted_at IS NULL;

-- Habit completions
CREATE TABLE IF NOT EXISTS habit_completions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id        UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL,
    completion_date DATE NOT NULL,
    completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes           TEXT,
    UNIQUE (habit_id, user_id, completion_date)
);

CREATE INDEX IF NOT EXISTS ix_habit_completions_user_date ON habit_completions(user_id, completion_date DESC);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    metric_type     VARCHAR(40) NOT NULL,
    target_value    NUMERIC NOT NULL,
    current_value   NUMERIC NOT NULL DEFAULT 0,
    unit            VARCHAR(20),
    deadline        DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_goals_user ON goals(user_id);

-- Health metrics (TimescaleDB hypertable)
CREATE TABLE IF NOT EXISTS health_metrics (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    metric_type     VARCHAR(40) NOT NULL,
    value           NUMERIC NOT NULL,
    unit            VARCHAR(20),
    source          VARCHAR(40) NOT NULL,
    metadata        JSONB,
    recorded_at     TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, recorded_at)
);

SELECT create_hypertable('health_metrics', 'recorded_at',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS ix_health_metrics_user_type_time
    ON health_metrics(user_id, metric_type, recorded_at DESC);

-- Journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    mood_score      INT NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
    energy_score    INT NOT NULL CHECK (energy_score BETWEEN 1 AND 10),
    stress_score    INT NOT NULL CHECK (stress_score BETWEEN 1 AND 10),
    notes           VARCHAR(2000),
    tags            JSONB,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_journal_user_time ON journal_entries(user_id, recorded_at DESC);

-- Integrations (OAuth tokens, Terra)
CREATE TABLE IF NOT EXISTS integrations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    provider            VARCHAR(40) NOT NULL,
    terra_user_id       TEXT,
    access_token        TEXT,
    refresh_token       TEXT,
    token_expires_at    TIMESTAMPTZ,
    scopes              TEXT[],
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, provider)
);
