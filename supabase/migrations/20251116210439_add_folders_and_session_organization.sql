/*
  # Add Folders for Chat Organization
  
  Adds folder management capabilities similar to ChatGPT's organization system.
  
  1. New Tables
    - `chat_folders`
      - `id` (uuid, primary key)
      - `name` (text) - Folder name
      - `color` (text) - Optional color for visual distinction
      - `sort_order` (integer) - Display order
      - `created_at`, `updated_at` (timestamptz)
  
  2. Changes to Existing Tables
    - `chat_sessions`
      - Add `folder_id` (uuid, nullable, foreign key to chat_folders)
      - Add `sort_order` (integer) - Order within folder
  
  3. Security
    - Enable RLS on chat_folders
    - Public access for demo (internal tool)
*/

-- Create chat_folders table
CREATE TABLE IF NOT EXISTS chat_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#6B7280',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read chat folders"
  ON chat_folders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert chat folders"
  ON chat_folders
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update chat folders"
  ON chat_folders
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete chat folders"
  ON chat_folders
  FOR DELETE
  TO public
  USING (true);

-- Add folder_id and sort_order to chat_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN folder_id uuid REFERENCES chat_folders(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN sort_order integer DEFAULT 0;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS chat_folders_sort_order_idx ON chat_folders(sort_order);
CREATE INDEX IF NOT EXISTS chat_sessions_folder_id_idx ON chat_sessions(folder_id);
CREATE INDEX IF NOT EXISTS chat_sessions_sort_order_idx ON chat_sessions(sort_order);

-- Insert default folders (optional starter folders)
INSERT INTO chat_folders (name, color, sort_order) VALUES
  ('E-Commerce', '#3B82F6', 0),
  ('Healthcare', '#10B981', 1),
  ('Financial Services', '#8B5CF6', 2)
ON CONFLICT DO NOTHING;
