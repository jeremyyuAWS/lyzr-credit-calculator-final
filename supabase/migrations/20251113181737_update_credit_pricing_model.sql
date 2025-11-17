/*
  # Update Credit Pricing Model to Transparent Structure
  
  1. Changes
    - Replace old credit categories with new transparent pricing model
    - New credit conversion: 1 Credit = $1 (previously 100 Credits = $1)
    - Add granular pricing for:
      - One-time creation costs (Agent, KB, RAI, Tool, Eval Suite)
      - Runtime usage-based costs (KB Retrieve, Memory, RAI Run, Evals, API calls, Web operations)
      - Storage costs (KB Ingestion and Storage)
      - Model handling (25% markup for Lyzr models, 0% for BYOM)
      - Agent communication tokens
  
  2. New Categories
    - Agent Creation (0.05C)
    - Knowledge Base Creation (1C)
    - RAI Creation (1C)
    - Tool Creation (0.10C)
    - Evaluation Suite Creation (2C)
    - KB Retrieve (0.05C per query)
    - Memory Operation (0.005C per operation)
    - RAI/HM Run (0.05C per run)
    - Standard Evaluation (1.0C per 100 tests)
    - Enterprise Evaluation (1.0C per 50 tests)
    - API Light Call (0.02C per call)
    - Web Fetch (0.1C per URL/PDF)
    - Deep Crawl (0.25C per additional page)
    - KB Ingestion (1.0C per 100k tokens)
    - KB Storage (0.2C per GB per month)
    - Agent Communication Tokens (1.0C per 1M tokens)
    - Model Handling - Lyzr (25% markup)
    - Model Handling - BYOM (0% markup)
  
  3. Notes
    - Billing granularity: 0.001C minimum
    - All prices are in Credits (1 Credit = $1)
*/

-- Clear existing global credit settings
DELETE FROM credit_settings_global;

-- Insert new transparent pricing model categories
INSERT INTO credit_settings_global (category, price_credits, unit) VALUES
  -- One-Time Creation Costs
  ('Agent Creation', 0.05, 'per agent'),
  ('Knowledge Base Creation', 1.0, 'per KB'),
  ('RAI Creation', 1.0, 'per RAI component'),
  ('Tool Creation', 0.10, 'per tool'),
  ('Evaluation Suite Creation', 2.0, 'per suite'),
  
  -- Runtime Usage-Based Costs
  ('KB Retrieve', 0.05, 'per query'),
  ('Memory Operation', 0.005, 'per operation'),
  ('RAI/HM Run', 0.05, 'per run'),
  ('Standard Evaluation', 1.0, 'per 100 tests'),
  ('Enterprise Evaluation', 1.0, 'per 50 tests'),
  ('API Light Call', 0.02, 'per call'),
  ('Web Fetch', 0.1, 'per URL or PDF'),
  ('Deep Crawl', 0.25, 'per additional page'),
  
  -- Knowledge Base Storage Costs
  ('KB Ingestion', 1.0, 'per 100k tokens'),
  ('KB Storage', 0.2, 'per GB/month'),
  
  -- Agent Communication
  ('Agent Communication Tokens', 1.0, 'per 1M tokens'),
  
  -- Model Handling
  ('Model Handling - Lyzr', 25.0, '% markup on base cost'),
  ('Model Handling - BYOM', 0.0, '% markup (free)')
ON CONFLICT (category) DO UPDATE SET
  price_credits = EXCLUDED.price_credits,
  unit = EXCLUDED.unit,
  updated_at = now();
