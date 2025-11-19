import { Shield, CheckCircle, AlertCircle, Lock, Eye, FileCheck } from 'lucide-react';

export default function ResponsibleAI() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
            <Shield className="h-8 w-8 stroke-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Responsible AI at Lyzr</h1>
            <p className="text-gray-600 text-lg">Our commitment to safe, ethical, and transparent AI</p>
          </div>
        </div>

        <div className="space-y-8 mt-8">
          <section>
            <h2 className="text-2xl font-semibold text-black mb-4">Core Principles</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              At Lyzr, we believe that powerful AI must be built on a foundation of trust, transparency, and accountability.
              Our Responsible AI framework ensures that every agent, workflow, and interaction adheres to the highest
              standards of safety and ethics.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="h-6 w-6 stroke-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-black mb-2">Safety Guardrails</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Every Lyzr agent is equipped with built-in safety mechanisms that prevent harmful outputs,
                    ensure appropriate content filtering, and maintain ethical boundaries in all interactions.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-start gap-3 mb-3">
                <Lock className="h-6 w-6 stroke-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-black mb-2">Data Privacy</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Your data is never used to train our models. We implement enterprise-grade encryption,
                    strict access controls, and comply with GDPR, CCPA, and other global privacy regulations.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-start gap-3 mb-3">
                <Eye className="h-6 w-6 stroke-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-black mb-2">Transparency</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We provide clear visibility into how our agents make decisions, what data they access,
                    and how they process information. No black boxes, just clarity.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
              <div className="flex items-start gap-3 mb-3">
                <FileCheck className="h-6 w-6 stroke-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-black mb-2">Compliance Ready</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Built for regulated industries with SOC 2 Type II, ISO 27001, and HIPAA compliance.
                    Comprehensive audit trails and monitoring for every interaction.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-black mb-4">Our Guardrails in Action</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-black mb-1">Content Filtering</h4>
                  <p className="text-gray-700">
                    Automatic detection and prevention of harmful, biased, or inappropriate content in both inputs and outputs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-black mb-1">Bias Mitigation</h4>
                  <p className="text-gray-700">
                    Continuous monitoring and correction for potential biases in agent responses across demographics, cultures, and contexts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-black mb-1">Human Oversight</h4>
                  <p className="text-gray-700">
                    Critical decisions can be routed to human reviewers. Configurable escalation policies ensure the right level of oversight.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-black mb-1">Hallucination Detection</h4>
                  <p className="text-gray-700">
                    Advanced verification mechanisms to identify and flag potentially inaccurate or fabricated information.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-black mb-1">Rate Limiting & Abuse Prevention</h4>
                  <p className="text-gray-700">
                    Intelligent throttling and abuse detection to prevent misuse while maintaining performance for legitimate users.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black mb-4">Continuous Improvement</h2>
            <p className="text-gray-700 leading-relaxed">
              Responsible AI is not a destination but a journey. We continuously update our models, refine our guardrails,
              and incorporate feedback from our community and independent auditors. Our dedicated AI Safety team works
              around the clock to ensure that Lyzr remains at the forefront of ethical AI development.
            </p>
          </section>

          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 stroke-white flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Report Concerns</h3>
                <p className="leading-relaxed mb-4">
                  If you encounter any issues with our AI systems or have concerns about safety, bias, or ethics,
                  please reach out to our AI Safety team immediately.
                </p>
                <a
                  href="mailto:safety@lyzr.ai"
                  className="inline-block px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Contact AI Safety Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
