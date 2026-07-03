CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id),
    alert_type TEXT NOT NULL, -- visibility_drop | sov_drop
    severity TEXT NOT NULL,   -- low | medium | high
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    acknowledged_at TIMESTAMPTZ
);

ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',
ADD COLUMN IF NOT EXISTS metric_value REAL,
ADD COLUMN IF NOT EXISTS baseline_value REAL,
ADD COLUMN IF NOT EXISTS threshold_value REAL,
ADD COLUMN IF NOT EXISTS dedupe_key TEXT,
ADD COLUMN IF NOT EXISTS evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

UPDATE alerts
SET
    title = COALESCE(title, initcap(replace(alert_type, '_', ' '))),
    status = CASE
        WHEN acknowledged_at IS NOT NULL THEN 'acknowledged'
        ELSE 'open'
    END,
    first_seen_at = COALESCE(first_seen_at, created_at),
    last_seen_at = COALESCE(last_seen_at, created_at),
    dedupe_key = COALESCE(dedupe_key, customer_id::text || ':' || COALESCE(source_id::text, 'none') || ':' || alert_type);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_brand ON alerts(brand_id);
CREATE INDEX IF NOT EXISTS idx_alerts_query ON alerts(query_id);
CREATE INDEX IF NOT EXISTS idx_alerts_dedupe ON alerts(dedupe_key);


CREATE INDEX IF NOT EXISTS idx_alerts_customer ON alerts(customer_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);


-- ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY alerts_isolation
-- ON alerts
-- USING (customer_id::text = current_setting('app.customer_id', true))
-- WITH CHECK (customer_id::text = current_setting('app.customer_id', true));
