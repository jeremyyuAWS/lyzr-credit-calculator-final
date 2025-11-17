/**
 * Lyzr Agent API Client
 *
 * Handles communication with Lyzr's Agent API for intelligent
 * cost discovery conversations.
 */

import { supabase, LyzrApiConfig } from './supabase';

const FALLBACK_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';
const FALLBACK_API_KEY = import.meta.env.VITE_LYZR_API_KEY || 'sk-default-0A5JJEw7EAAZwRcRPoWMejq639VytMoh';
const FALLBACK_AGENT_ID = import.meta.env.VITE_LYZR_AGENT_ID || '691a0afa5848af7d875ae981';

export interface LyzrChatRequest {
  user_id: string;
  agent_id: string;
  session_id: string;
  message: string;
}

export interface LyzrChatResponse {
  response: string;
  session_id: string;
  agent_id: string;
  metadata?: Record<string, any>;
}

export class LyzrAgentClient {
  private cachedConfig: LyzrApiConfig | null = null;
  private lastConfigFetch: number = 0;
  private configCacheDuration: number = 60000;

  constructor() {}

  private async getConfig(): Promise<LyzrApiConfig> {
    const now = Date.now();

    if (this.cachedConfig && (now - this.lastConfigFetch) < this.configCacheDuration) {
      return this.cachedConfig;
    }

    try {
      const { data, error } = await supabase
        .from('lyzr_api_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data && data.enabled) {
        this.cachedConfig = data;
        this.lastConfigFetch = now;
        return data;
      }
    } catch (error) {
      console.error('Error fetching Lyzr API config:', error);
    }

    return {
      id: 'fallback',
      api_url: FALLBACK_API_URL,
      api_key: FALLBACK_API_KEY,
      agent_id: FALLBACK_AGENT_ID,
      default_user_id: 'user@lyzr.ai',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Send a message to the Lyzr Agent and get a response
   */
  async chat(
    userId: string,
    sessionId: string,
    message: string
  ): Promise<LyzrChatResponse> {
    try {
      const config = await this.getConfig();

      const request: LyzrChatRequest = {
        user_id: userId || config.default_user_id,
        agent_id: config.agent_id,
        session_id: sessionId,
        message: message,
      };

      const response = await fetch(config.api_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.api_key,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Lyzr API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        response: data.response || data.message || '',
        session_id: data.session_id || sessionId,
        agent_id: data.agent_id || config.agent_id,
        metadata: data.metadata || {},
      };
    } catch (error) {
      console.error('Lyzr Agent API Error:', error);
      throw error;
    }
  }

  /**
   * Clear the cached configuration (useful after updating config in admin panel)
   */
  clearCache(): void {
    this.cachedConfig = null;
    this.lastConfigFetch = 0;
  }

  /**
   * Initialize a new conversation session with the agent
   */
  async initializeSession(userId: string, sessionId: string): Promise<LyzrChatResponse> {
    const initialMessage = `Hello! I'm here to help you estimate the cost of your AI workflow. Let's start by understanding what you're building. What business problem or workflow are you trying to automate with AI?`;

    return this.chat(userId, sessionId, '');
  }

  /**
   * Extract structured data from agent conversation
   * The agent should be trained to return JSON in a specific format
   */
  extractWorkflowData(response: LyzrChatResponse): Record<string, any> | null {
    try {
      // Look for JSON in the response metadata or parse from message
      if (response.metadata && response.metadata.extracted_data) {
        return response.metadata.extracted_data;
      }

      // Try to parse JSON from response text
      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return null;
    } catch (error) {
      console.error('Error extracting workflow data:', error);
      return null;
    }
  }

  /**
   * Check if conversation is complete
   */
  isConversationComplete(response: LyzrChatResponse): boolean {
    const completionKeywords = [
      'proceed to calculator',
      'calculation complete',
      'ready to estimate',
      'gathered all information',
      'estimate is ready',
    ];

    const responseLower = response.response.toLowerCase();
    return completionKeywords.some(keyword => responseLower.includes(keyword));
  }
}

export const lyzrAgentClient = new LyzrAgentClient();
