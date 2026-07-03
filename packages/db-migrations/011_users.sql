CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    email TEXT NOT NULL,
    name TEXT,
    provider TEXT NOT NULL,          -- google | email
    provider_id TEXT,                -- OAuth subject
    created_at TIMESTAMPTZ DEFAULT now(),

    -- REQUIRED for OAuth upsert
    UNIQUE (provider, provider_id)
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_verification_token_hash TEXT,
ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;

UPDATE users
SET email_verified = true
WHERE email_verified IS DISTINCT FROM true;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS password_reset_token_hash TEXT,
ADD COLUMN IF NOT EXISTS password_reset_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;


-- Optional but recommended
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_customer
ON users(customer_id);

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY users_isolation
-- ON users
-- USING (customer_id::text = current_setting('app.customer_id', true))
-- WITH CHECK (customer_id::text = current_setting('app.customer_id', true));
