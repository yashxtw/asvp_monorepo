ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_verification_token_hash TEXT,
ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;

UPDATE users
SET email_verified = true
WHERE email_verified IS DISTINCT FROM true;
