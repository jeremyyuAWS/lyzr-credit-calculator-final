export default function AboutCreditConsumption() {
  return (
    <div className="glass-card-light rounded-2xl p-6">
      <h2 className="text-xl font-bold text-black mb-4">About Credit Consumption</h2>

      <div className="space-y-4 text-gray-700">
        <p>
          Lyzr credits are consumed based on various operations performed by your AI agents throughout their workflow execution.
        </p>

        <div className="space-y-2">
          <h3 className="font-semibold text-black">Credit Usage Factors:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>LLM API calls and token usage (input + output)</li>
            <li>Knowledge base ingestion and vector storage</li>
            <li>Web fetching and data retrieval operations</li>
            <li>Inter-agent communication and coordination</li>
            <li>External API integrations</li>
            <li>Vector search and semantic queries</li>
            <li>Data processing and transformation operations</li>
          </ul>
        </div>

        <p className="text-sm">
          Each operation has a specific credit cost that can be customized through the Global Settings. Account-level overrides allow you to adjust pricing for specific use cases without affecting global defaults.
        </p>
      </div>
    </div>
  );
}
