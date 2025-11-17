/*
  # Premium Business Report & Email Delivery Schema
  
  This migration adds support for storing generated business reports and tracking email deliveries.
  
  ## 1. New Tables
  
  ### `report_analyses`
  Stores generated business reports with full workflow analysis
  - `id` (uuid, primary key)
  - `session_id` (uuid, nullable) - Links to chat_sessions for context
  - `report_title` (text) - User-friendly report title
  - `workflow_config` (jsonb) - Complete workflow configuration
  - `cost_breakdown` (jsonb) - Detailed cost analysis
  - `executive_summary` (text) - AI-generated summary
  - `workflow_narrative` (text) - Step-by-step workflow description
  - `agent_breakdown` (jsonb) - Agent attribution data
  - `model_rationale` (text) - Model selection reasoning
  - `optimization_suggestions` (jsonb) - Cost optimization recommendations
  - `metadata` (jsonb) - Additional report metadata
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `report_deliveries`
  Tracks email deliveries of reports
  - `id` (uuid, primary key)
  - `report_id` (uuid) - Links to report_analyses
  - `recipient_email` (text) - Email address
  - `delivery_status` (text) - 'pending', 'sent', 'failed', 'bounced'
  - `pdf_url` (text, nullable) - URL to generated PDF (if stored)
  - `error_message` (text, nullable) - Error details if failed
  - `sent_at` (timestamptz, nullable)
  - `opened_at` (timestamptz, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## 2. Security
  - Enable RLS on all tables
  - Public access for demo purposes (internal tool)
  
  ## 3. Indexes
  - Index on session_id for quick lookup
  - Index on recipient_email for tracking
  - Index on created_at for sorting
*/

-- Create report_analyses table
CREATE TABLE IF NOT EXISTS report_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE SET NULL,
  report_title text NOT NULL,
  workflow_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  cost_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  executive_summary text DEFAULT '',
  workflow_narrative text DEFAULT '',
  agent_breakdown jsonb DEFAULT '[]'::jsonb,
  model_rationale text DEFAULT '',
  optimization_suggestions jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE report_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read report analyses"
  ON report_analyses FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert report analyses"
  ON report_analyses FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update report analyses"
  ON report_analyses FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete report analyses"
  ON report_analyses FOR DELETE
  TO public
  USING (true);

-- Create report_deliveries table
CREATE TABLE IF NOT EXISTS report_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES report_analyses(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  delivery_status text NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'bounced')),
  pdf_url text,
  error_message text,
  sent_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE report_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read report deliveries"
  ON report_deliveries FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert report deliveries"
  ON report_deliveries FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update report deliveries"
  ON report_deliveries FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete report deliveries"
  ON report_deliveries FOR DELETE
  TO public
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_analyses_session_id ON report_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_report_analyses_created_at ON report_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_deliveries_report_id ON report_deliveries(report_id);
CREATE INDEX IF NOT EXISTS idx_report_deliveries_recipient_email ON report_deliveries(recipient_email);
CREATE INDEX IF NOT EXISTS idx_report_deliveries_created_at ON report_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_deliveries_status ON report_deliveries(delivery_status);
