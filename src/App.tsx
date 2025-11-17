import { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatInput from './components/ChatInput';
import ScenarioCard, { Scenario } from './components/ScenarioCard';
import VolumeControls, { VolumeControl } from './components/VolumeControls';
import CostSummary from './components/CostSummary';
import ForecastChart from './components/ForecastChart';
import CalculationBreakdown from './components/CalculationBreakdown';
import AboutCreditConsumption from './components/AboutCreditConsumption';
import AdminPanel from './components/AdminPanel';
import {
  CalculatorState,
  calculateCreditsPerTransaction,
  calculateMonthlyCredits,
  calculateMonthlyCost,
  calculateDailyCost,
  calculateAnnualCost,
} from './lib/calculator';
import { supabase } from './lib/supabase';

const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: '1',
    title: 'Basic Deployment',
    description: 'Simple workflow with minimal agent interaction',
    agents: 2,
    complexity: 'Low',
    monthlyUsers: 500,
    estimatedCredits: 16500,
    features: ['Document Processing', 'Email Verification'],
  },
  {
    id: '2',
    title: 'Standard Deployment',
    description: 'Multi-agent system with moderate complexity',
    agents: 4,
    complexity: 'Moderate',
    monthlyUsers: 2000,
    estimatedCredits: 165000,
    features: ['Document Processing', 'Email Verification', 'Chatbot', 'Analytics'],
  },
  {
    id: '3',
    title: 'Enterprise Deployment',
    description: 'Complex multi-agent orchestration with advanced features',
    agents: 8,
    complexity: 'High',
    monthlyUsers: 10000,
    estimatedCredits: 1650000,
    features: ['Document Processing', 'Email Verification', 'Chatbot', 'Analytics', 'Custom Workflows', 'Integration Hub'],
  },
];

interface ScenarioTemplate {
  basic: {
    title: string;
    description: string;
    agents: number;
    complexity: 'Low' | 'Moderate' | 'High';
    monthlyUsers: number;
    features: string[];
  };
  standard: {
    title: string;
    description: string;
    agents: number;
    complexity: 'Low' | 'Moderate' | 'High';
    monthlyUsers: number;
    features: string[];
  };
  premium: {
    title: string;
    description: string;
    agents: number;
    complexity: 'Low' | 'Moderate' | 'High';
    monthlyUsers: number;
    features: string[];
  };
}

function generateScenariosFromInput(input: string): ScenarioTemplate {
  const inputLower = input.toLowerCase();

  if (inputLower.includes('e-commerce') || inputLower.includes('ecommerce') || inputLower.includes('product')) {
    return {
      basic: {
        title: 'E-commerce Starter',
        description: 'Basic product catalog with order processing (avg 2K input, 800 output tokens/user)',
        agents: 3,
        complexity: 'Low',
        monthlyUsers: 2000,
        features: ['Product Recommendations', 'Order Processing', 'Email Notifications'],
      },
      standard: {
        title: 'E-commerce Professional',
        description: 'Full-featured store with AI recommendations (avg 5K input, 2K output tokens/user)',
        agents: 6,
        complexity: 'Moderate',
        monthlyUsers: 5000,
        features: ['AI Product Recommendations', 'Order Processing', 'Chatbot Support', 'Inventory Management'],
      },
      premium: {
        title: 'E-commerce Enterprise',
        description: 'Advanced platform with personalization (avg 12K input, 5K output tokens/user)',
        agents: 10,
        complexity: 'High',
        monthlyUsers: 10000,
        features: ['Advanced Personalization', 'Multi-channel Support', 'Predictive Analytics', 'Custom Integrations', '24/7 Support'],
      },
    };
  }

  if (inputLower.includes('hr') || inputLower.includes('onboarding') || inputLower.includes('employee')) {
    return {
      basic: {
        title: 'HR Onboarding Lite',
        description: 'Streamlined employee onboarding (avg 3K input, 1.2K output tokens/employee)',
        agents: 2,
        complexity: 'Low',
        monthlyUsers: 200,
        features: ['Document Verification', 'Training Modules', 'Task Tracking'],
      },
      standard: {
        title: 'HR Onboarding Pro',
        description: 'Comprehensive onboarding with automation (avg 8K input, 3K output tokens/employee)',
        agents: 4,
        complexity: 'Moderate',
        monthlyUsers: 500,
        features: ['Document Verification', 'Automated Workflows', 'Training Management', 'Compliance Tracking'],
      },
      premium: {
        title: 'HR Onboarding Enterprise',
        description: 'Full HR suite with AI-powered insights (avg 15K input, 6K output tokens/employee)',
        agents: 7,
        complexity: 'High',
        monthlyUsers: 1000,
        features: ['End-to-end Automation', 'AI Insights', 'Custom Workflows', 'Integration Hub', 'Analytics Dashboard'],
      },
    };
  }

  if (inputLower.includes('financial') || inputLower.includes('loan') || inputLower.includes('credit')) {
    return {
      basic: {
        title: 'Financial Services Basic',
        description: 'Essential loan processing (avg 4K input, 1.5K output tokens/application)',
        agents: 3,
        complexity: 'Low',
        monthlyUsers: 1000,
        features: ['Credit Analysis', 'Document Processing', 'Basic Compliance'],
      },
      standard: {
        title: 'Financial Services Standard',
        description: 'Advanced loan processing with compliance (avg 10K input, 4K output tokens/application)',
        agents: 5,
        complexity: 'Moderate',
        monthlyUsers: 2000,
        features: ['Credit Analysis', 'Document Verification', 'Compliance Checks', 'Risk Assessment'],
      },
      premium: {
        title: 'Financial Services Enterprise',
        description: 'Comprehensive financial platform (avg 20K input, 8K output tokens/application)',
        agents: 9,
        complexity: 'High',
        monthlyUsers: 5000,
        features: ['Advanced Credit Analysis', 'Full Compliance Suite', 'Risk Management', 'Fraud Detection', 'Regulatory Reporting'],
      },
    };
  }

  if (inputLower.includes('healthcare') || inputLower.includes('patient') || inputLower.includes('medical')) {
    return {
      basic: {
        title: 'Healthcare Portal Basic',
        description: 'Essential patient management (avg 3K input, 1K output tokens/patient)',
        agents: 3,
        complexity: 'Low',
        monthlyUsers: 1500,
        features: ['Appointment Scheduling', 'Medical Records', 'Patient Portal'],
      },
      standard: {
        title: 'Healthcare Portal Standard',
        description: 'Comprehensive patient care platform (avg 7K input, 3K output tokens/patient)',
        agents: 5,
        complexity: 'Moderate',
        monthlyUsers: 3000,
        features: ['Appointment Scheduling', 'Medical Records', 'Symptom Analysis', 'Telehealth Integration'],
      },
      premium: {
        title: 'Healthcare Portal Enterprise',
        description: 'Advanced healthcare management system (avg 18K input, 7K output tokens/patient)',
        agents: 8,
        complexity: 'High',
        monthlyUsers: 6000,
        features: ['AI Symptom Analysis', 'Full EHR Integration', 'Telehealth', 'Predictive Analytics', 'HIPAA Compliance'],
      },
    };
  }

  if (inputLower.includes('education') || inputLower.includes('learning') || inputLower.includes('student')) {
    return {
      basic: {
        title: 'Education Platform Starter',
        description: 'Basic learning management (avg 1.5K input, 600 output tokens/student/month)',
        agents: 3,
        complexity: 'Low',
        monthlyUsers: 5000,
        features: ['Course Management', 'Student Portal', 'Basic Assessment'],
      },
      standard: {
        title: 'Education Platform Pro',
        description: 'Advanced LMS with personalization (avg 4K input, 1.8K output tokens/student/month)',
        agents: 6,
        complexity: 'Moderate',
        monthlyUsers: 10000,
        features: ['Course Recommendations', 'Automated Grading', 'Student Support', 'Progress Tracking'],
      },
      premium: {
        title: 'Education Platform Enterprise',
        description: 'AI-powered learning ecosystem (avg 9K input, 4K output tokens/student/month)',
        agents: 9,
        complexity: 'High',
        monthlyUsers: 20000,
        features: ['AI Personalization', 'Advanced Analytics', 'Adaptive Learning', 'Multi-school Support', 'Parent Portal'],
      },
    };
  }

  if (inputLower.includes('real estate') || inputLower.includes('property') || inputLower.includes('crm')) {
    return {
      basic: {
        title: 'Real Estate CRM Lite',
        description: 'Essential property management (avg 2.5K input, 1K output tokens/inquiry)',
        agents: 2,
        complexity: 'Low',
        monthlyUsers: 800,
        features: ['Lead Management', 'Property Listings', 'Contact Management'],
      },
      standard: {
        title: 'Real Estate CRM Pro',
        description: 'Advanced property management system (avg 6K input, 2.5K output tokens/inquiry)',
        agents: 4,
        complexity: 'Moderate',
        monthlyUsers: 1500,
        features: ['Lead Qualification', 'Document Processing', 'Virtual Tours', 'Client Portal'],
      },
      premium: {
        title: 'Real Estate CRM Enterprise',
        description: 'Full-featured real estate platform (avg 14K input, 5.5K output tokens/inquiry)',

        agents: 7,
        complexity: 'High',
        monthlyUsers: 3000,
        features: ['AI Lead Scoring', 'Automated Workflows', 'Virtual Tours', 'Market Analytics', 'Multi-agent Support'],
      },
    };
  }

  return {
    basic: {
      title: 'Custom Solution Basic',
      description: 'Cost-effective solution for your requirements (avg 2.5K input, 1K output tokens/user)',
      agents: 3,
      complexity: 'Low',
      monthlyUsers: 1000,
      features: ['Core Features', 'Basic Integration', 'Standard Support'],
    },
    standard: {
      title: 'Custom Solution Standard',
      description: 'Balanced approach with growth potential (avg 6K input, 2.5K output tokens/user)',
      agents: 5,
      complexity: 'Moderate',
      monthlyUsers: 2500,
      features: ['All Core Features', 'Advanced Integration', 'Priority Support', 'Custom Workflows'],
    },
    premium: {
      title: 'Custom Solution Premium',
      description: 'Full-featured solution with maximum scalability (avg 15K input, 6K output tokens/user)',
      agents: 10,
      complexity: 'High',
      monthlyUsers: 15000,
      features: ['Enterprise Features', 'Full Integration Suite', 'Dedicated Support', 'Custom AI Models', 'SLA Guarantees'],
    },
  };
}

function calculateEstimatedCredits(agents: number, complexity: string, monthlyUsers: number): number {
  const baseCredits = 40;
  const complexityMultiplier = complexity === 'Low' ? 0.6 : complexity === 'Moderate' ? 0.9 : 1.56;
  const agentMultiplier = agents <= 2 ? 0.8 : agents <= 5 ? 1.2 : 1.6;
  const transactionsPerDay = Math.ceil(monthlyUsers / 22);

  return Math.round(baseCredits * complexityMultiplier * agentMultiplier * transactionsPerDay * 22);
}

function getScenarioType(input: string): string {
  const inputLower = input.toLowerCase();
  if (inputLower.includes('e-commerce') || inputLower.includes('ecommerce') || inputLower.includes('product')) return 'E-commerce';
  if (inputLower.includes('hr') || inputLower.includes('onboarding') || inputLower.includes('employee')) return 'HR';
  if (inputLower.includes('financial') || inputLower.includes('loan') || inputLower.includes('credit')) return 'Financial';
  if (inputLower.includes('healthcare') || inputLower.includes('patient') || inputLower.includes('medical')) return 'Healthcare';
  if (inputLower.includes('education') || inputLower.includes('learning') || inputLower.includes('student')) return 'Education';
  if (inputLower.includes('real estate') || inputLower.includes('property') || inputLower.includes('crm')) return 'Real Estate';
  return 'General';
}

function generateVolumeControls(scenarioType: string, monthlyUsers: number): VolumeControl[] {
  const transactionsPerDay = Math.ceil(monthlyUsers / 22);

  switch (scenarioType) {
    case 'E-commerce':
      return [
        { key: 'orders', label: 'Orders per Day', value: transactionsPerDay, min: 10, max: 2000, step: 10 },
        { key: 'products', label: 'Products in Catalog', value: 500, min: 50, max: 10000, step: 50 },
        { key: 'recommendations', label: 'AI Recommendations per Order', value: 5, min: 1, max: 20, step: 1 },
        { key: 'supportTickets', label: 'Support Tickets per Day', value: 50, min: 5, max: 500, step: 5 },
      ];
    case 'HR':
      return [
        { key: 'newHires', label: 'New Hires per Month', value: monthlyUsers, min: 10, max: 2000, step: 10 },
        { key: 'documents', label: 'Documents per Employee', value: 15, min: 5, max: 50, step: 1 },
        { key: 'trainingModules', label: 'Training Modules', value: 8, min: 3, max: 30, step: 1 },
        { key: 'complianceChecks', label: 'Compliance Checks per Employee', value: 5, min: 1, max: 20, step: 1 },
      ];
    case 'Financial':
      return [
        { key: 'applications', label: 'Applications per Day', value: transactionsPerDay, min: 10, max: 500, step: 10 },
        { key: 'creditChecks', label: 'Credit Checks per Application', value: 3, min: 1, max: 10, step: 1 },
        { key: 'documents', label: 'Documents per Application', value: 12, min: 5, max: 50, step: 1 },
        { key: 'complianceRules', label: 'Compliance Rules to Verify', value: 25, min: 5, max: 100, step: 5 },
        { key: 'riskAssessments', label: 'Risk Assessments per Application', value: 2, min: 1, max: 5, step: 1 },
      ];
    case 'Healthcare':
      return [
        { key: 'appointments', label: 'Appointments per Day', value: transactionsPerDay, min: 10, max: 1000, step: 10 },
        { key: 'medicalRecords', label: 'Records Processed per Day', value: 100, min: 10, max: 500, step: 10 },
        { key: 'symptomAnalyses', label: 'AI Symptom Analyses per Day', value: 50, min: 5, max: 300, step: 5 },
        { key: 'prescriptions', label: 'Prescriptions per Day', value: 30, min: 5, max: 200, step: 5 },
      ];
    case 'Education':
      return [
        { key: 'students', label: 'Active Students', value: monthlyUsers, min: 100, max: 50000, step: 100 },
        { key: 'courses', label: 'Active Courses', value: 50, min: 5, max: 500, step: 5 },
        { key: 'assessments', label: 'Assessments Graded per Day', value: 200, min: 20, max: 2000, step: 20 },
        { key: 'recommendations', label: 'Course Recommendations per Student', value: 8, min: 3, max: 30, step: 1 },
      ];
    case 'Real Estate':
      return [
        { key: 'inquiries', label: 'Inquiries per Day', value: transactionsPerDay, min: 10, max: 500, step: 10 },
        { key: 'properties', label: 'Properties Listed', value: 200, min: 20, max: 5000, step: 20 },
        { key: 'virtualTours', label: 'Virtual Tours per Day', value: 30, min: 5, max: 200, step: 5 },
        { key: 'documents', label: 'Documents per Transaction', value: 10, min: 3, max: 30, step: 1 },
      ];
    default:
      return [
        { key: 'transactions', label: 'Transactions per Day', value: transactionsPerDay, min: 10, max: 1000, step: 10 },
        { key: 'workingDays', label: 'Working Days per Month', value: 22, min: 1, max: 31, step: 1 },
        { key: 'interactions', label: 'Agent Interactions per Transaction', value: 3, min: 1, max: 10, step: 1 },
      ];
  }
}

function App() {
  const [accountId, setAccountId] = useState<string>('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(DEFAULT_SCENARIOS[1].id);
  const [userInput, setUserInput] = useState<string>('');
  const [scenarioType, setScenarioType] = useState<string>('General');
  const [volumeControls, setVolumeControls] = useState<VolumeControl[]>(
    generateVolumeControls('General', 2000)
  );

  const [state, setState] = useState<CalculatorState>({
    scenario: 'standard',
    complexity: 'moderate',
    agentType: 'multi',
    registrationsPerDay: 100,
    workingDaysPerMonth: 22,
    baseCredits: 40,
  });

  useEffect(() => {
    loadDemoAccount();
  }, []);

  async function loadDemoAccount() {
    try {
      const { data } = await supabase
        .from('accounts')
        .select('id')
        .eq('name', 'Demo Account')
        .maybeSingle();

      if (data) {
        setAccountId(data.id);
      }
    } catch (error) {
      console.error('Error loading demo account:', error);
    }
  }

  const handleAnalyzeScenario = async (input: string) => {
    setUserInput(input);
    setIsAnalyzing(true);

    setTimeout(() => {
      const template = generateScenariosFromInput(input);
      const detectedScenarioType = getScenarioType(input);
      const analyzedScenariosWithIds: Scenario[] = [
        {
          id: 'analyzed-1',
          title: template.basic.title,
          description: template.basic.description,
          agents: template.basic.agents,
          complexity: template.basic.complexity,
          monthlyUsers: template.basic.monthlyUsers,
          estimatedCredits: calculateEstimatedCredits(template.basic.agents, template.basic.complexity, template.basic.monthlyUsers),
          features: template.basic.features,
        },
        {
          id: 'analyzed-2',
          title: template.standard.title,
          description: template.standard.description,
          agents: template.standard.agents,
          complexity: template.standard.complexity,
          monthlyUsers: template.standard.monthlyUsers,
          estimatedCredits: calculateEstimatedCredits(template.standard.agents, template.standard.complexity, template.standard.monthlyUsers),
          features: template.standard.features,
        },
        {
          id: 'analyzed-3',
          title: template.premium.title,
          description: template.premium.description,
          agents: template.premium.agents,
          complexity: template.premium.complexity,
          monthlyUsers: template.premium.monthlyUsers,
          estimatedCredits: calculateEstimatedCredits(template.premium.agents, template.premium.complexity, template.premium.monthlyUsers),
          features: template.premium.features,
        },
      ];

      setScenarios(analyzedScenariosWithIds);
      setSelectedScenarioId(analyzedScenariosWithIds[1].id);
      setScenarioType(detectedScenarioType);
      setVolumeControls(generateVolumeControls(detectedScenarioType, template.standard.monthlyUsers));
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleVolumeControlChange = (key: string, value: number) => {
    setVolumeControls((prev) =>
      prev.map((control) => (control.key === key ? { ...control, value } : control))
    );

    if (key === 'transactions' || key === 'orders' || key === 'applications' ||
        key === 'appointments' || key === 'inquiries' || key === 'newHires' ||
        key === 'students') {
      setState((prev) => ({ ...prev, registrationsPerDay: value }));
    } else if (key === 'workingDays') {
      setState((prev) => ({ ...prev, workingDaysPerMonth: value }));
    } else {
      const multiplier = 1 + (value / 100);
      setState((prev) => ({ ...prev, baseCredits: Math.round(40 * multiplier) }));
    }
  };

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[1];

  useEffect(() => {
    const complexityMap: Record<string, 'simple' | 'moderate' | 'complex'> = {
      'Low': 'simple',
      'Moderate': 'moderate',
      'High': 'complex',
    };

    const scenarioTypeMap: Record<string, 'optimized' | 'standard' | 'premium'> = {
      'Low': 'optimized',
      'Moderate': 'standard',
      'High': 'premium',
    };

    const agentTypeMap: Record<number, 'single' | 'multi' | 'orchestrated'> = {
      1: 'single',
      2: 'multi',
      3: 'multi',
      4: 'multi',
      5: 'multi',
      6: 'orchestrated',
      7: 'orchestrated',
      8: 'orchestrated',
      9: 'orchestrated',
      10: 'orchestrated',
    };

    const transactionsPerDay = Math.ceil(selectedScenario.monthlyUsers / 22);
    const baseCreditsMap: Record<string, number> = {
      'Low': 40,
      'Moderate': 40,
      'High': 40,
    };

    setState({
      scenario: scenarioTypeMap[selectedScenario.complexity] || 'standard',
      complexity: complexityMap[selectedScenario.complexity] || 'moderate',
      agentType: agentTypeMap[selectedScenario.agents] || 'multi',
      registrationsPerDay: transactionsPerDay,
      workingDaysPerMonth: 22,
      baseCredits: baseCreditsMap[selectedScenario.complexity] || 40,
    });
  }, [selectedScenarioId, selectedScenario]);

  const creditsPerTransaction = calculateCreditsPerTransaction(state);
  const monthlyCredits = calculateMonthlyCredits(state);
  const monthlyCost = calculateMonthlyCost(state);
  const dailyCost = calculateDailyCost(state);
  const annualCost = calculateAnnualCost(state);

  return (
    <div className="min-h-screen">
      <Header
        company="Demo Account"
        agents={`${selectedScenario.agents}-Agent System`}
        useCase="AI-Powered Solutions"
        complexity={selectedScenario.complexity}
        onSettingsClick={() => setAdminOpen(true)}
      />

      <div className="max-w-[1600px] mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <ChatInput onSubmit={handleAnalyzeScenario} isAnalyzing={isAnalyzing} />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                {userInput ? 'Analyzed Scenarios' : 'Sample Scenarios'}
              </h3>
              {scenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  isSelected={scenario.id === selectedScenarioId}
                  onSelect={() => setSelectedScenarioId(scenario.id)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <VolumeControls
              controls={volumeControls}
              onChange={handleVolumeControlChange}
              scenarioType={scenarioType}
            />

            <CostSummary
              creditsPerTransaction={creditsPerTransaction}
              monthlyCredits={monthlyCredits}
              monthlyCost={monthlyCost}
              dailyCost={dailyCost}
              annualCost={annualCost}
            />

            <ForecastChart currentMonthlyCost={monthlyCost} />

            <CalculationBreakdown state={state} />

            <AboutCreditConsumption />
          </div>
        </div>
      </div>

      <AdminPanel
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
      />
    </div>
  );
}

export default App;
