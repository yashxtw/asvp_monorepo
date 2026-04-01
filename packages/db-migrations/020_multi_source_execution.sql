ALTER TABLE runs
ADD COLUMN IF NOT EXISTS execution_group_id UUID,
ADD COLUMN IF NOT EXISTS trigger_type TEXT DEFAULT 'scheduled';

UPDATE runs
SET execution_group_id = id
WHERE execution_group_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_runs_execution_group
ON runs (execution_group_id);

CREATE INDEX IF NOT EXISTS idx_runs_query_execution_group
ON runs (query_id, execution_group_id);

ALTER TABLE answers
ADD COLUMN IF NOT EXISTS query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS execution_group_id UUID;

UPDATE answers a
SET
    query_id = r.query_id,
    source_id = r.source_id,
    execution_group_id = COALESCE(r.execution_group_id, r.id)
FROM runs r
WHERE a.run_id = r.id
  AND (
    a.query_id IS NULL
    OR a.source_id IS NULL
    OR a.execution_group_id IS NULL
  );

CREATE INDEX IF NOT EXISTS idx_answers_query_source
ON answers (query_id, source_id);

CREATE INDEX IF NOT EXISTS idx_answers_execution_group
ON answers (execution_group_id);

CREATE INDEX IF NOT EXISTS idx_answers_customer_source_time
ON answers (customer_id, source_id, created_at DESC);
