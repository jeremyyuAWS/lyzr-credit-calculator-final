import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ReportEmailRequest {
  report_id: string;
  recipient_email: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { report_id, recipient_email }: ReportEmailRequest = await req.json();

    if (!report_id || !recipient_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: report_id, recipient_email' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch report data
    const { data: report, error: reportError } = await supabase
      .from('report_analyses')
      .select('*')
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      return new Response(
        JSON.stringify({ error: 'Report not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate email HTML
    const emailHtml = generateEmailHtml(report, recipient_email);

    // In a production environment, this would integrate with a transactional email service
    // like SendGrid, AWS SES, Resend, etc.
    // For now, we'll simulate the email send and update the delivery status

    console.log('Email would be sent to:', recipient_email);
    console.log('Report ID:', report_id);

    // Update delivery status
    const { error: updateError } = await supabase
      .from('report_deliveries')
      .update({
        delivery_status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('report_id', report_id)
      .eq('recipient_email', recipient_email);

    if (updateError) {
      console.error('Error updating delivery status:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Report email sent successfully',
        report_id,
        recipient_email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-report-email:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateEmailHtml(report: any, recipientEmail: string): string {
  const workflowConfig = report.workflow_config;
  const costBreakdown = report.cost_breakdown;
  const creditPrice = 0.008;
  const monthlyCostUSD = (costBreakdown.monthly_credits * creditPrice).toFixed(2);
  const perTransactionUSD = (costBreakdown.credits_per_transaction * creditPrice).toFixed(4);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.report_title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
    .container { background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 5px 0 0; color: #666; }
    .section { margin: 30px 0; }
    .section h2 { font-size: 20px; margin-bottom: 15px; color: #000; border-left: 4px solid #000; padding-left: 12px; }
    .summary-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin: 20px 0; }
    .cost-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
    .cost-card { background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; }
    .cost-card h3 { margin: 0 0 10px; font-size: 14px; color: #666; }
    .cost-card p { margin: 0; font-size: 24px; font-weight: bold; color: #000; }
    .agent-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .agent-table th { background: #f8f9fa; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; }
    .agent-table td { padding: 12px; border-bottom: 1px solid #e9ecef; }
    .recommendation { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; border-radius: 4px; }
    .recommendation h4 { margin: 0 0 10px; color: #856404; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #666; font-size: 12px; }
    .cta-button { display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AI Workflow Cost Analysis</h1>
      <p>Generated for ${recipientEmail} on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="summary-box">
      <h2 style="color: white; border: none; padding: 0;">Executive Summary</h2>
      <p style="white-space: pre-line; opacity: 0.95;">${report.executive_summary}</p>
    </div>

    <div class="section">
      <h2>Cost Breakdown</h2>
      <div class="cost-grid">
        <div class="cost-card">
          <h3>Per Interaction</h3>
          <p>$${perTransactionUSD}</p>
        </div>
        <div class="cost-card">
          <h3>Monthly Cost</h3>
          <p>$${monthlyCostUSD}</p>
        </div>
        <div class="cost-card">
          <h3>Annual Projection</h3>
          <p>$${(parseFloat(monthlyCostUSD) * 12).toLocaleString()}</p>
        </div>
      </div>
    </div>

    ${report.agent_breakdown && report.agent_breakdown.length > 0 ? `
    <div class="section">
      <h2>Agent Breakdown</h2>
      <table class="agent-table">
        <thead>
          <tr>
            <th>Agent</th>
            <th>Role</th>
            <th>Calls</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          ${report.agent_breakdown.map((agent: any) => `
            <tr>
              <td><strong>${agent.agent_name}</strong></td>
              <td>${agent.agent_role}</td>
              <td>${agent.call_count}</td>
              <td>$${agent.cost_usd.toFixed(4)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="section">
      <h2>Model Selection</h2>
      <p style="white-space: pre-line;">${report.model_rationale}</p>
    </div>

    ${report.optimization_suggestions && report.optimization_suggestions.length > 0 ? `
    <div class="section">
      <h2>Optimization Recommendations</h2>
      ${report.optimization_suggestions.map((suggestion: any) => `
        <div class="recommendation">
          <h4>${suggestion.title}</h4>
          <p>${suggestion.description}</p>
          ${suggestion.potential_savings_usd ? `<p><strong>Potential Savings: $${suggestion.potential_savings_usd.toFixed(2)}</strong></p>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div style="text-align: center; margin: 40px 0;">
      <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app') || '#'}" class="cta-button">Explore Calculator</a>
    </div>

    <div class="footer">
      <p>This report was generated by Lyzr AI Credit Calculator</p>
      <p>For questions or support, contact your account executive</p>
    </div>
  </div>
</body>
</html>
  `;
}
