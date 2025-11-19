/*
  # Add metadata column to chat_sessions

  1. Changes
    - Add metadata jsonb column to chat_sessions table for storing additional session data like lyzr_session_id
*/

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
