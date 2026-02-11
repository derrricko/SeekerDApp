-- Add optional note of encouragement to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS note TEXT;
