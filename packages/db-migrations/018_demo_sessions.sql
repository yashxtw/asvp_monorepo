CREATE TABLE IF NOT EXISTS demo_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    has_run BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_sessions_ip ON demo_sessions(ip_address);

CREATE TABLE IF NOT EXISTS demo_daily_cap (
    day DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    count INT DEFAULT 0
);

INSERT INTO customers (id, name, plan, run_limit)
VALUES ('d3b07384-d113-41c3-a309-8809c916298b', 'demo', 'pro', 999999)
ON CONFLICT (name) DO NOTHING;
