-- Add is_active column to tags table
ALTER TABLE tags ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for filtering by is_active
CREATE INDEX idx_tags_is_active ON tags(is_active);
