import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CreditSettingGlobal {
  id: string;
  category: string;
  price_credits: number;
  unit: string;
  setting_type: string;
  description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditSettingOverride {
  id: string;
  account_id: string;
  category: string;
  price_credits: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  name: string;
  global_discount_percentage?: number;
  billing_mode?: string;
  custom_model_handling_fee?: number;
  created_at: string;
}

export interface AccountDiscount {
  id: string;
  account_id: string;
  discount_percentage: number;
  discount_type: string;
  feature_category: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LLMPricing {
  id: string;
  provider: string;
  model: string;
  input_cost_per_million: number;
  output_cost_per_million: number;
  comment: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingVersionLog {
  id: string;
  version: string;
  updated_by: string;
  change_summary: string;
  created_at: string;
}

export interface FeaturePricing {
  id: string;
  feature_name: string;
  cost_credits: number;
  unit: string;
  category: string;
  description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SetupCost {
  id: string;
  item_name: string;
  cost_credits: number;
  unit: string;
  description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelHandlingFee {
  id: string;
  fee_percentage: number;
  applies_to: string;
  description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  session_name: string;
  workflow_description: string;
  extracted_data: Record<string, any>;
  status: 'draft' | 'in_progress' | 'completed';
  folder_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'ai' | 'user';
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ChatFolder {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ReportAnalysis {
  id: string;
  session_id: string | null;
  report_title: string;
  workflow_config: Record<string, any>;
  cost_breakdown: Record<string, any>;
  executive_summary: string;
  workflow_narrative: string;
  agent_breakdown: any[];
  model_rationale: string;
  optimization_suggestions: any[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ReportDelivery {
  id: string;
  report_id: string;
  recipient_email: string;
  delivery_status: 'pending' | 'sent' | 'failed' | 'bounced';
  pdf_url: string | null;
  error_message: string | null;
  sent_at: string | null;
  opened_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LyzrApiConfig {
  id: string;
  api_url: string;
  api_key: string;
  agent_id: string;
  default_user_id: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}
