ALTER TABLE recommendations
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS root_cause TEXT,
ADD COLUMN IF NOT EXISTS secondary_causes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS query_intent TEXT,
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS distribution JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS priority_score REAL,
ADD COLUMN IF NOT EXISTS confidence REAL,
ADD COLUMN IF NOT EXISTS source_type_snapshot TEXT;

CREATE INDEX IF NOT EXISTS idx_recommendations_brand_id
ON recommendations(brand_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_root_cause
ON recommendations(root_cause);

CREATE INDEX IF NOT EXISTS idx_recommendations_priority_score
ON recommendations(priority_score);
