import { useState, useEffect } from 'react';
import { Save, RefreshCw, CheckCircle, XCircle, Loader } from 'lucide-react';
import { supabase, LyzrApiConfig } from '../../lib/supabase';
import { lyzrAgentClient } from '../../lib/lyzrAgentClient';

export default function LyzrApiSettingsTab() {
  const [config, setConfig] = useState<LyzrApiConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    api_url: '',
    api_key: '',
    agent_id: '',
    default_user_id: '',
    enabled: true,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lyzr_api_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data);
        setFormData({
          api_url: data.api_url,
          api_key: data.api_key,
          agent_id: data.agent_id,
          default_user_id: data.default_user_id,
          enabled: data.enabled,
        });
      }
    } catch (error) {
      console.error('Error loading Lyzr API config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSuccessMessage('');

      const updateData = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (config) {
        const { error } = await supabase
          .from('lyzr_api_config')
          .update(updateData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lyzr_api_config')
          .insert([updateData]);

        if (error) throw error;
      }

      lyzrAgentClient.clearCache();
      await loadConfig();
      setSuccessMessage('Configuration saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving Lyzr API config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    try {
      setTesting(true);
      setTestResult(null);

      const response = await fetch(formData.api_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': formData.api_key,
        },
        body: JSON.stringify({
          user_id: formData.default_user_id,
          agent_id: formData.agent_id,
          session_id: `test-${Date.now()}`,
          message: 'Hello, this is a test connection.',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: `Connection successful! Agent responded: "${data.response?.substring(0, 100)}..."`,
        });
      } else {
        setTestResult({
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setTesting(false);
    }
  }

  function handleReset() {
    if (!confirm('Reset to default configuration?')) return;

    setFormData({
      api_url: 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/',
      api_key: 'sk-default-0A5JJEw7EAAZwRcRPoWMejq639VytMoh',
      agent_id: '691a0afa5848af7d875ae981',
      default_user_id: 'user@lyzr.ai',
      enabled: true,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lyzr Agent API Configuration</h2>
          <p className="text-gray-600">
            Configure the Lyzr Agent API endpoint and credentials used in the Chat Discovery feature.
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            {successMessage}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Endpoint URL
            </label>
            <input
              type="text"
              value={formData.api_url}
              onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
              placeholder="https://agent-prod.studio.lyzr.ai/v3/inference/chat/"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Full URL to the Lyzr Agent inference endpoint
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder="sk-default-..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-mono"
            />
            <p className="mt-1 text-xs text-gray-500">
              API authentication key (x-api-key header)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent ID
            </label>
            <input
              type="text"
              value={formData.agent_id}
              onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
              placeholder="691a0afa5848af7d875ae981"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-mono"
            />
            <p className="mt-1 text-xs text-gray-500">
              Unique identifier for the Lyzr Agent to use
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default User ID
            </label>
            <input
              type="text"
              value={formData.default_user_id}
              onChange={(e) => setFormData({ ...formData, default_user_id: e.target.value })}
              placeholder="user@lyzr.ai"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Default user ID for API requests (can be overridden per conversation)
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
              Enable Lyzr Agent API (when disabled, Chat Discovery uses demo mode)
            </label>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Configuration
              </>
            )}
          </button>

          <button
            onClick={handleTestConnection}
            disabled={testing || !formData.api_url || !formData.api_key || !formData.agent_id}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-black rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
          >
            {testing ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Test Connection
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Reset to Default
          </button>
        </div>

        {testResult && (
          <div
            className={`mt-4 p-4 rounded-lg border flex items-start gap-3 ${
              testResult.success
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium">
                {testResult.success ? 'Connection Successful' : 'Connection Failed'}
              </p>
              <p className="text-sm mt-1">{testResult.message}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Usage Example</h3>
        <div className="bg-white border border-blue-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
          <pre className="text-gray-700">
{`curl -X POST '${formData.api_url}' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: ${formData.api_key.substring(0, 20)}...' \\
  -d '{
    "user_id": "${formData.default_user_id}",
    "agent_id": "${formData.agent_id}",
    "session_id": "unique-session-id",
    "message": "Your message here"
  }'`}
          </pre>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Configuration Notes</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="text-gray-400">•</span>
            <span>Changes take effect immediately for new conversations</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-400">•</span>
            <span>Existing conversations continue using their original configuration</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-400">•</span>
            <span>If API calls fail, the system automatically falls back to demo mode</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-400">•</span>
            <span>Test the connection before saving to ensure credentials are valid</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
