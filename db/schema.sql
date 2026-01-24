-- JobCheck Database Schema
-- Run this script to initialize the database

CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  last_checked VARCHAR(20) NOT NULL,
  current_job JSONB NOT NULL,
  job_history JSONB DEFAULT '[]'::jsonb,
  email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_people_name ON people(name);
CREATE INDEX IF NOT EXISTS idx_people_created_at ON people(created_at);
