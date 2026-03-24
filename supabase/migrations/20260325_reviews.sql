CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT CHECK (char_length(comment) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id)  -- 주문당 리뷰 1개
);
CREATE INDEX IF NOT EXISTS idx_reviews_driver_id ON reviews(driver_id);

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
