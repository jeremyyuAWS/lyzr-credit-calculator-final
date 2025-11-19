/*
  # Update Use Case Templates

  Updates the use case templates to match the new categories:
  - Customer Engagement & Support
  - Workflow & Process Automation
  - Knowledge & Information Retrieval (RAG)
  - Communication & Outreach Automation
  - Data Enrichment & Intelligence
  - Voice & Call Handling
  - Custom / Multi-Agent Workflow (Advanced)

  Each template includes:
  - Updated template names and descriptions
  - Appropriate icons
  - Default capabilities
*/

-- Temporarily disable the foreign key constraint
ALTER TABLE guided_setup_sessions DROP CONSTRAINT IF EXISTS guided_setup_sessions_use_case_id_fkey;

-- Set all existing session use_case_id to NULL
UPDATE guided_setup_sessions SET use_case_id = NULL;

-- Clear existing templates
TRUNCATE TABLE use_case_templates CASCADE;

-- Insert new use case templates
INSERT INTO use_case_templates (
  template_name,
  template_description,
  icon,
  default_capabilities,
  sort_order
) VALUES
(
  'Customer Engagement & Support',
  'Automate customer or employee questions, support flows, and ticketing.',
  '💬',
  '["rag_knowledge_base", "multi_turn_conversation", "email_automation", "db_operations"]'::jsonb,
  1
),
(
  'Workflow & Process Automation',
  'Trigger and orchestrate multi-step operations automatically.',
  '⚙️',
  '["multi_step_workflow", "db_operations", "api_integration", "task_orchestration"]'::jsonb,
  2
),
(
  'Knowledge & Information Retrieval (RAG)',
  'Answer questions using your internal documents and data.',
  '📚',
  '["rag_knowledge_base", "multi_turn_conversation", "document_processing"]'::jsonb,
  3
),
(
  'Communication & Outreach Automation',
  'Draft and send personalized emails, responses, and follow-ups.',
  '✉️',
  '["email_automation", "content_generation", "api_integration"]'::jsonb,
  4
),
(
  'Data Enrichment & Intelligence',
  'Pull data from APIs or CRMs to enhance your records and workflows.',
  '📊',
  '["api_integration", "db_operations", "data_transformation"]'::jsonb,
  5
),
(
  'Voice & Call Handling',
  'Automate intake calls, Q&A, surveys, and conversational flows.',
  '📞',
  '["voice_integration", "multi_turn_conversation", "db_operations"]'::jsonb,
  6
),
(
  'Custom / Multi-Agent Workflow (Advanced)',
  'Build a fully customized agent or multi-agent automation.',
  '🚀',
  '["multi_agent_orchestration", "custom_tools", "api_integration", "rag_knowledge_base", "multi_step_workflow"]'::jsonb,
  7
);

-- Re-add the foreign key constraint
ALTER TABLE guided_setup_sessions 
ADD CONSTRAINT guided_setup_sessions_use_case_id_fkey 
FOREIGN KEY (use_case_id) 
REFERENCES use_case_templates(id) 
ON DELETE SET NULL;
