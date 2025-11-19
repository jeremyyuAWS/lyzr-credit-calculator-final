import { useState, useEffect } from 'react';
import { ShoppingBag, Building2, DollarSign, TrendingUp, Star, Plus, Edit2, Trash2, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CustomerTemplate {
  id?: string;
  template_key: string;
  template_name: string;
  icon: string;
  description: string;
  industry: string;
  company_size: 'startup' | 'small' | 'medium' | 'enterprise';
  typical_volumes: any;
  typical_complexity: string;
  typical_features: any;
  estimated_monthly_cost_min: number;
  estimated_monthly_cost_max: number;
  usage_patterns: any;
  growth_trajectory: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

interface CustomerTemplatesProps {
  onApplyTemplate?: (template: CustomerTemplate) => void;
}

export default function CustomerTemplates({ onApplyTemplate }: CustomerTemplatesProps) {
  const [templates, setTemplates] = useState<CustomerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<CustomerTemplate>>({});

  const iconOptions = ['🛍️', '🏥', '💰', '💼', '🎓', '🏭', '🏢', '📱', '🚗', '🏦', '✈️', '🎬'];
  const companySizes = ['startup', 'small', 'medium', 'enterprise'];

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const { data, error } = await supabase
        .from('customer_segment_templates')
        .select('*')
        .order('display_order, template_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }

  function startCreating() {
    setFormData({
      template_key: '',
      template_name: '',
      icon: '🏢',
      description: '',
      industry: '',
      company_size: 'medium',
      typical_volumes: {
        emails_per_month: 5000,
        chats_per_month: 3000,
        documents_processed: 1000,
        voice_calls_per_month: 500
      },
      typical_complexity: 'medium',
      typical_features: {
        rag_enabled: true,
        multi_agent: false,
        avg_rag_per_txn: 2,
        avg_tool_calls: 1
      },
      estimated_monthly_cost_min: 2000,
      estimated_monthly_cost_max: 4000,
      usage_patterns: {
        peak_hours: 'Business hours',
        seasonal: false,
        growth_rate: '10% monthly'
      },
      growth_trajectory: 'Steady growth',
      is_active: true,
      is_featured: false,
      display_order: templates.length
    });
    setIsCreating(true);
  }

  function startEditing(template: CustomerTemplate) {
    setFormData(template);
    setEditingId(template.id || null);
  }

  function cancelEditing() {
    setEditingId(null);
    setIsCreating(false);
    setFormData({});
  }

  async function saveTemplate() {
    if (!formData.template_name || !formData.template_key) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('customer_segment_templates')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customer_segment_templates')
          .insert([{
            ...formData,
            created_by: 'admin'
          }]);

        if (error) throw error;
      }

      await loadTemplates();
      cancelEditing();
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(error.message || 'Failed to save template');
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return;

    try {
      const { error } = await supabase
        .from('customer_segment_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  }

  async function duplicateTemplate(template: CustomerTemplate) {
    const newTemplate = {
      ...template,
      template_key: `${template.template_key}_copy_${Date.now()}`,
      template_name: `${template.template_name} (Copy)`,
      is_featured: false,
      display_order: templates.length
    };

    delete (newTemplate as any).id;
    delete (newTemplate as any).created_at;
    delete (newTemplate as any).updated_at;

    try {
      const { error } = await supabase
        .from('customer_segment_templates')
        .insert([newTemplate]);

      if (error) throw error;
      await loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Failed to duplicate template');
    }
  }

  function applyTemplate(template: CustomerTemplate) {
    if (onApplyTemplate) {
      onApplyTemplate(template);
    }
  }

  const featuredTemplates = templates.filter(t => t.is_featured && t.is_active);
  const allActiveTemplates = templates.filter(t => t.is_active);

  if (loading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Customer Segment Templates</h3>
          <p className="text-sm text-gray-600 mt-1">
            Pre-configured templates for common customer segments and industries
          </p>
        </div>
        <button
          onClick={startCreating}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {(isCreating || editingId) && (
        <div className="bg-white border-2 border-black rounded-2xl p-6 space-y-4">
          <h4 className="font-semibold">{editingId ? 'Edit Template' : 'Create New Template'}</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Template Name *</label>
              <input
                type="text"
                value={formData.template_name || ''}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                placeholder="e.g., E-commerce Startup"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Template Key *</label>
              <input
                type="text"
                value={formData.template_key || ''}
                onChange={(e) => setFormData({ ...formData, template_key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="e.g., ecommerce_startup"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`text-2xl p-2 border-2 rounded-lg hover:border-black ${
                      formData.icon === icon ? 'border-black bg-gray-100' : 'border-gray-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Company Size</label>
              <select
                value={formData.company_size}
                onChange={(e) => setFormData({ ...formData, company_size: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                {companySizes.map(size => (
                  <option key={size} value={size}>{size.charAt(0).toUpperCase() + size.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this customer segment..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Industry</label>
              <input
                type="text"
                value={formData.industry || ''}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., E-commerce"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Complexity</label>
              <select
                value={formData.typical_complexity}
                onChange={(e) => setFormData({ ...formData, typical_complexity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="simple">Simple</option>
                <option value="medium">Medium</option>
                <option value="complex">Complex</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Monthly Cost Range (Min)</label>
              <input
                type="number"
                value={formData.estimated_monthly_cost_min || 0}
                onChange={(e) => setFormData({ ...formData, estimated_monthly_cost_min: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Monthly Cost Range (Max)</label>
              <input
                type="number"
                value={formData.estimated_monthly_cost_max || 0}
                onChange={(e) => setFormData({ ...formData, estimated_monthly_cost_max: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Featured</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveTemplate}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              {editingId ? 'Update' : 'Create'} Template
            </button>
            <button
              onClick={cancelEditing}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {featuredTemplates.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-600" />
            Featured Templates
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {featuredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={startEditing}
                onDelete={deleteTemplate}
                onDuplicate={duplicateTemplate}
                onApply={applyTemplate}
                isFeatured
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-medium mb-3">All Templates ({allActiveTemplates.length})</h4>
        <div className="grid grid-cols-3 gap-4">
          {allActiveTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={startEditing}
              onDelete={deleteTemplate}
              onDuplicate={duplicateTemplate}
              onApply={applyTemplate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: CustomerTemplate;
  onEdit: (template: CustomerTemplate) => void;
  onDelete: (id: string) => void;
  onDuplicate: (template: CustomerTemplate) => void;
  onApply: (template: CustomerTemplate) => void;
  isFeatured?: boolean;
}

function TemplateCard({ template, onEdit, onDelete, onDuplicate, onApply, isFeatured }: TemplateCardProps) {
  const volumes = template.typical_volumes || {};
  const totalVolume = (volumes.emails_per_month || 0) + (volumes.chats_per_month || 0);

  return (
    <div className={`bg-white border-2 rounded-2xl p-5 hover:border-black transition-all ${
      isFeatured ? 'border-yellow-400' : 'border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{template.icon}</div>
          <div>
            <h5 className="font-semibold">{template.template_name}</h5>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                {template.company_size}
              </span>
              {isFeatured && (
                <Star className="h-3 w-3 text-yellow-600 fill-yellow-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {template.description}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Industry:</span>
          <span className="font-medium">{template.industry}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Monthly Volume:</span>
          <span className="font-medium">{totalVolume.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Est. Cost:</span>
          <span className="font-medium text-green-700">
            ${template.estimated_monthly_cost_min?.toLocaleString()} - ${template.estimated_monthly_cost_max?.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onApply(template)}
          className="flex-1 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
        >
          Apply
        </button>
        <button
          onClick={() => onEdit(template)}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          title="Edit"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => template.id && onDuplicate(template)}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          title="Duplicate"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={() => template.id && onDelete(template.id)}
          className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}