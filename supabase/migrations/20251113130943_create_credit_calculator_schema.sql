/*
  # Lyzr Credits Calculator Schema
  
  1. New Tables
    - `credit_settings_global`
      - `id` (uuid, primary key)
      - `category` (text) - Operation category (e.g., "KB Ingestion", "API Call")
      - `price_credits` (numeric) - Credit cost per unit
      - `unit` (text) - Unit of measurement (e.g., "per 1000 tokens", "per call")
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `credit_settings_overrides`
      - `id` (uuid, primary key)
      - `account_id` (text) - Account identifier
      - `category` (text) - References global category
      - `price_credits` (numeric) - Override credit cost
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `accounts`
      - `id` (uuid, primary key)
      - `name` (text) - Account/company name
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Allow public read access for demo purposes
    - Restrict writes to authenticated users
  
  3. Initial Data
    - Seed global credit settings with default categories
*/

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read accounts"
  ON accounts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert accounts"
  ON accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create global credit settings table
CREATE TABLE IF NOT EXISTS credit_settings_global (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text UNIQUE NOT NULL,
  price_credits numeric NOT NULL DEFAULT 0,
  unit text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE credit_settings_global ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read global credit settings"
  ON credit_settings_global
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update global credit settings"
  ON credit_settings_global
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create credit settings overrides table
CREATE TABLE IF NOT EXISTS credit_settings_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category text NOT NULL,
  price_credits numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, category)
);

ALTER TABLE credit_settings_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read credit overrides"
  ON credit_settings_overrides
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage credit overrides"
  ON credit_settings_overrides
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed global credit settings with default categories
INSERT INTO credit_settings_global (category, price_credits, unit) VALUES
  ('KB Ingestion', 5, 'per 1000 tokens'),
  ('Web Fetch', 2, 'per fetch'),
  ('API Call', 3, 'per call'),
  ('Inter-Agent Communication', 4, 'per message'),
  ('LLM Usage (GPT-4)', 10, 'per 1000 tokens'),
  ('LLM Usage (GPT-3.5)', 2, 'per 1000 tokens'),
  ('Vector Search', 1, 'per query'),
  ('Data Processing', 3, 'per operation')
ON CONFLICT (category) DO NOTHING;

-- Seed a demo account
INSERT INTO accounts (name) VALUES ('Demo Account')
ON CONFLICT DO NOTHING;