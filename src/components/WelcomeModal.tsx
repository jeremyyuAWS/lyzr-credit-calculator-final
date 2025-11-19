import { X, Compass, MessageCircle } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'guided' | 'chat') => void;
}

export default function WelcomeModal({ isOpen, onClose, onSelectMode }: WelcomeModalProps) {
  if (!isOpen) return null;

  function handleModeSelect(mode: 'guided' | 'chat') {
    onSelectMode(mode);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 stroke-black" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-black mb-2">
            How would you like to explore Lyzr's Cost Calculator?
          </h2>
          <p className="text-gray-600">
            Choose your preferred way to discover pricing and build your agent configuration
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={() => handleModeSelect('guided')}
            className="relative group bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-8 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                Recommended
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-3xl">
                <Compass className="h-7 w-7 stroke-white" />
              </div>
              <h3 className="text-2xl font-bold text-black">Guided Setup</h3>
            </div>

            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Step-by-step, fast, no typing. Build your agent setup in under 60 seconds.
            </p>

            <div className="text-sm text-blue-700 font-medium">
              Perfect for most users →
            </div>
          </button>

          <button
            onClick={() => handleModeSelect('chat')}
            className="relative group bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-300 rounded-xl p-8 hover:border-gray-500 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-3xl">
                <MessageCircle className="h-7 w-7 stroke-white" />
              </div>
              <h3 className="text-2xl font-bold text-black">Chat Discovery</h3>
            </div>

            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Explore ideas conversationally, ask questions, and get suggestions.
            </p>

            <div className="text-sm text-gray-600 font-medium">
              For exploratory use cases →
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          You can switch modes anytime from the top-right menu
        </p>
      </div>
    </div>
  );
}
