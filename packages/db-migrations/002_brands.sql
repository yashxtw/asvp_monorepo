CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    canonical_urls TEXT[] NOT NULL,
    profile_meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brands_customer_id ON brands(customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_brand ON brands(customer_id, brand_name);

ALTER TABLE brands 
ADD COLUMN description TEXT,
ADD COLUMN logo_url TEXT,
ADD COLUMN competitors TEXT[] default '{}';
