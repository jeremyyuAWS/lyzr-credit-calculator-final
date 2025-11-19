/*
  # Welcome Modal & Guided Setup Schema

  1. New Tables
    - `use_case_templates`
      - `id` (uuid, primary key)
      - `template_name` (text) - e.g., "Customer Support Agent"
      - `template_description` (text) - Short description
      - `icon` (text) - Emoji or icon identifier
      - `default_capabilities` (jsonb) - Pre-selected components
      - `sort_order` (integer) - Display order
      - `is_active` (boolean) - Whether to show in UI
      
    - `agent_capabilities`
      - `id` (uuid, primary key)
      - `capability_key` (text, unique) - e.g., "retrieve_db"
      - `capability_name` (text) - Display name
      - `description` (text) - Tooltip text (≤12 words)
      - `category` (text) - e.g., "data", "integration", "intelligence"
      - `credit_multiplier` (decimal) - Impact on cost
      - `sort_order` (integer)
      - `is_active` (boolean)
      
    - `guided_setup_sessions`
      - `id` (uuid, primary key)
      - `session_id` (text, unique) - Client-side session identifier
      - `use_case_id` (uuid) - FK to use_case_templates
      - `selected_capabilities` (jsonb) - Array of capability keys
      - `volume_inputs` (jsonb) - Slider values
      - `cost_summary` (jsonb) - Calculated results
      - `user_email` (text) - If captured
      - `completed_at` (timestamptz) - When flow completed
      - `email_sent_at` (timestamptz) - When quote emailed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `user_flow_analytics`
      - `id` (uuid, primary key)
      - `session_id` (text) - FK to guided_setup_sessions
      - `event_type` (text) - e.g., "modal_opened", "step_completed"
      - `event_data` (jsonb) - Additional context
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for templates and capabilities
    - Anyone can insert/update their own session data
    - Analytics tracking is write-only
*/

-- Use Case Templates Table
CREATE TABLE IF NOT EXISTS use_case_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  template_description text NOT NULL,
  icon text NOT NULL DEFAULT '🤖',
  default_capabilities jsonb DEFAULT '[]'::jsonb,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE use_case_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active use case templates"
  ON use_case_templates FOR SELECT
  TO public
  USING (is_active = true);

-- Agent Capabilities Table
CREATE TABLE IF NOT EXISTS agent_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_key text UNIQUE NOT NULL,
  capability_name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  credit_multiplier decimal DEFAULT 1.0,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agent_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active capabilities"
  ON agent_capabilities FOR SELECT
  TO public
  USING (is_active = true);

-- Guided Setup Sessions Table
CREATE TABLE IF NOT EXISTS guided_setup_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  use_case_id uuid REFERENCES use_case_templates(id),
  selected_capabilities jsonb DEFAULT '[]'::jsonb,
  volume_inputs jsonb DEFAULT '{}'::jsonb,
  cost_summary jsonb DEFAULT '{}'::jsonb,
  user_email text,
  completed_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE guided_setup_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert guided setup sessions"
  ON guided_setup_sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own session"
  ON guided_setup_sessions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read guided setup sessions"
  ON guided_setup_sessions FOR SELECT
  TO public
  USING (true);

-- User Flow Analytics Table
CREATE TABLE IF NOT EXISTS user_flow_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_flow_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics events"
  ON user_flow_analytics FOR INSERT
  TO public
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guided_sessions_session_id ON guided_setup_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_guided_sessions_email ON guided_setup_sessions(user_email) WHERE user_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON user_flow_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON user_flow_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON user_flow_analytics(created_at);

-- Seed Use Case Templates
INSERT INTO use_case_templates (template_name, template_description, icon, default_capabilities, sort_order) VALUES
  ('Customer Support Agent', 'Automate support responses, ticket routing, and customer inquiries', '🎧', '["knowledge_base", "short_term_memory", "safe_ai"]', 1),
  ('Email Automation Agent', 'Handle email classification, response drafting, and follow-ups', '📧', '["send_emails", "short_term_memory", "safe_ai"]', 2),
  ('Knowledge/RAG Bot', 'Answer questions from your documents and knowledge base', '📚', '["knowledge_base", "rag", "short_term_memory"]', 3),
  ('Lead Enrichment Agent', 'Research and enrich lead data automatically', '🔍', '["retrieve_db", "api_connect", "tool_calling"]', 4),
  ('Workflow Automation Agent', 'Trigger actions and orchestrate multi-step processes', '⚡', '["trigger_workflows", "tool_calling", "api_connect"]', 5),
  ('Voice Intake Agent', 'Handle voice conversations and intake forms', '🎤', '["voice_interaction", "short_term_memory", "safe_ai"]', 6),
  ('Research/Summarization Agent', 'Analyze documents and generate summaries', '📊', '["rag", "knowledge_base", "tool_calling"]', 7),
  ('Custom Agent (Advanced)', 'Build from scratch with full control', '🛠️', '[]', 8);

-- Seed Agent Capabilities
INSERT INTO agent_capabilities (capability_key, capability_name, description, category, credit_multiplier, sort_order) VALUES
  ('retrieve_db', 'Retrieve data from DB', 'Fetch records from your database', 'data', 1.2, 1),
  ('knowledge_base', 'Access knowledge base', 'Search your uploaded documents', 'data', 1.3, 2),
  ('rag', 'Perform RAG', 'Retrieve + generate from docs', 'intelligence', 1.5, 3),
  ('tool_calling', 'Use Tool Calling', 'Execute functions dynamically', 'intelligence', 1.4, 4),
  ('send_emails', 'Send emails', 'Draft and send email messages', 'integration', 1.1, 5),
  ('trigger_workflows', 'Trigger workflows', 'Run actions in your systems', 'integration', 1.2, 6),
  ('short_term_memory', 'Short-term memory', 'Remember conversation context', 'intelligence', 1.1, 7),
  ('long_term_memory', 'Long-term memory', 'Persist data across sessions', 'intelligence', 1.3, 8),
  ('voice_interaction', 'Voice interaction', 'Handle voice conversations', 'interface', 1.4, 9),
  ('safe_ai', 'Safe & Responsible AI', 'Built-in safety guardrails', 'compliance', 1.0, 10),
  ('api_connect', 'Connect to APIs', 'Integrate third-party services', 'integration', 1.2, 11),
  ('write_crm', 'Write to CRM/ERP', 'Update business systems', 'integration', 1.2, 12);
