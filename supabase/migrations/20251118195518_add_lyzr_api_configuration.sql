/*
  # Add Lyzr API Configuration Settings
  
  Allows admin users to configure the Lyzr Agent API endpoint.
  
  1. New Tables
    - `lyzr_api_config` - API configuration
  
  2. Security
    - Enable RLS
    - Public access for demo
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
  ON lyzr_api_config FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert lyzr api config"
  ON lyzr_api_config FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update lyzr api config"
  ON lyzr_api_config FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete lyzr api config"
  ON lyzr_api_config FOR DELETE TO public USING (true);

-- Insert default configuration
INSERT INTO lyzr_api_config (api_url, api_key, agent_id, enabled)
SELECT 
  'https://agent-prod.studio.lyzr.ai/v3/inference/chat/',
  'sk-default-0A5JJEw7EAAZwRcRPoWMejq639VytMoh',
  '691a0afa5848af7d875ae981',
  true
WHERE NOT EXISTS (SELECT 1 FROM lyzr_api_config LIMIT 1);