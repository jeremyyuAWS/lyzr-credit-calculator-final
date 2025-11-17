/*
  # Chat Discovery Schema
  
  Creates tables for managing chat-based workflow discovery sessions.
  
  1. New Tables
    - `chat_sessions`
      - `id` (uuid, primary key)
      - `session_name` (text) - User-friendly session name
      - `workflow_description` (text) - Final workflow summary
      - `extracted_data` (jsonb) - Complete extraction of 14 dimensions
      - `status` (text) - draft, in_progress, completed
      - `created_at`, `updated_at` (timestamptz)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to chat_sessions)
      - `role` (text) - 'ai' or 'user'
      - `message` (text) - Message content
      - `metadata` (jsonb) - Additional context
      - `created_at` (timestamptz)
      - Ordered by created_at
  
  2. Security
    - Enable RLS on all tables
    - Public access for demo (internal tool)
  
  3. Initial Data
    - None (sessions created on demand)
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name text NOT NULL DEFAULT 'New Workflow',
  workflow_description text DEFAULT '',
  extracted_data jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read chat sessions"
  ON chat_sessions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert chat sessions"
  ON chat_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update chat sessions"
  ON chat_sessions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete chat sessions"
  ON chat_sessions
  FOR DELETE
  TO public
  USING (true);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('ai', 'user')),
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read chat messages"
  ON chat_messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert chat messages"
  ON chat_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update chat messages"
  ON chat_messages
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete chat messages"
  ON chat_messages
  FOR DELETE
  TO public
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);
