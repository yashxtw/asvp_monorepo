CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free',
    billing_id TEXT,
    sso_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_plan ON customers(plan);

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS run_limit INTEGER DEFAULT 100;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'inactive';

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS razorpay_payment_link_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
