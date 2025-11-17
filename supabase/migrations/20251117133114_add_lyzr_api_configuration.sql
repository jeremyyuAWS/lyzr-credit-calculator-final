/*
  # Add Lyzr API Configuration Settings
  
  Allows admin users to configure the Lyzr Agent API endpoint and credentials
  used in the Chat Discovery feature.
  
  1. New Tables
    - `lyzr_api_config`
      - `id` (uuid, primary key)
      - `api_url` (text) - Full API endpoint URL
      - `api_key` (text) - API authentication key
      - `agent_id` (text) - Default agent ID to use
      - `default_user_id` (text) - Default user ID for API calls
      - `enabled` (boolean) - Whether to use Lyzr API or fallback to demo
      - `created_at`, `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on lyzr_api_config
    - Public access for demo (internal tool)
  
  3. Default Configuration
    - Pre-populate with provided API credentials
*/

CREATE TABLE IF NOT EXISTS lyzr_api_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text NOT NULL DEFAULT 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/',
  api_key text NOT NULL,
  agent_id text NOT NULL,
  default_user_id text DEFAULT 'user@lyzr.ai',
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lyzr_api_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read lyzr api config"
  ON lyzr_api_config
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert lyzr api config"
  ON lyzr_api_config
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update lyzr api config"
  ON lyzr_api_config
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete lyzr api config"
  ON lyzr_api_config
  FOR DELETE
  TO public
  USING (true);

-- Insert default configuration (only if table is empty)
INSERT INTO lyzr_api_config (api_url, api_key, agent_id, enabled)
SELECT 
  'https://agent-prod.studio.lyzr.ai/v3/inference/chat/',
  'sk-default-0A5JJEw7EAAZwRcRPoWMejq639VytMoh',
  '691a0afa5848af7d875ae981',
  true
WHERE NOT EXISTS (SELECT 1 FROM lyzr_api_config LIMIT 1);
