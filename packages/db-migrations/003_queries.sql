CREATE TABLE IF NOT EXISTS queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    query_type TEXT NOT NULL, -- brand | category | competitor
    frequency TEXT NOT NULL DEFAULT 'daily', -- daily | weekly | manual
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_queries_customer_id ON queries(customer_id);
CREATE INDEX IF NOT EXISTS idx_queries_type ON queries(query_type);

ALTER TABLE queries
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

CREATE INDEX IF NOT EXISTS idx_queries_brand
ON queries(brand_id);

CREATE INDEX idx_queries_brand_customer
ON queries(brand_id, customer_id);

ALTER TABLE queries
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS schedule_id TEXT;

CREATE INDEX IF NOT EXISTS idx_queries_active
ON queries(is_active);

ALTER TABLE queries ADD COLUMN is_paused boolean DEFAULT false;

ALTER TABLE queries
    ALTER COLUMN schedule_id TYPE uuid
    USING schedule_id::uuid;

ALTER TABLE queries ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE; 
ALTER TABLE queries ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;







