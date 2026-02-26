-- Migration: Add soft delete support
-- Run this in Supabase SQL Editor

ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for faster queries filtering out deleted posts
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at);
