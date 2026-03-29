import { useState } from 'react';
import { UserProfile } from '../types';
import { 
  FileText, 
  BrainCircuit, 
  Loader2, 
  Copy, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Zap,
  Lightbulb
} from 'lucide-react';
import { simplifyNotes } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';

interface NotesSimplifierProps {
  user: UserProfile;
}

export default function NotesSimplifier({ user }: NotesSimplifierProps) {
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<{ summary: string; explanation: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSimplify = async () => {
    if (!notes) return;
    setLoading(true);
    try {
      const simplified = await simplifyNotes(notes);
      setResult(simplified);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${result.summary}\n\n${result.explanation}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">AI Notes Simplifier</h1>
          <p className="text-neutral-500 mt-1">Transform complex academic text into clear, simple explanations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                <FileText size={20} className="text-primary-600" />
                Input Notes
              </h2>
              <button 
                onClick={() => setNotes('')}
                className="text-xs font-bold text-neutral-400 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-4 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 h-[400px] resize-none text-sm mb-6 leading-relaxed"
              placeholder="Paste your complex lecture notes, textbook paragraphs, or research papers here..."
            />
            <button 
              onClick={handleSimplify}
              disabled={loading || !notes}
              className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary-100"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              Simplify Now
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Summary Card */}
                <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <Zap size={20} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">Quick Summary</h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">{result.summary}</p>
                </div>

                {/* Detailed Explanation */}
                <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Lightbulb size={20} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">Simple Explanation</h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">{result.explanation}</p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all"
                  >
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                  <button 
                    onClick={() => setResult(null)}
                    className="px-6 py-3 bg-white border border-neutral-200 text-neutral-600 rounded-2xl font-bold hover:bg-neutral-50 transition-all"
                  >
                    Reset
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-12 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm text-neutral-300">
                  <BrainCircuit size={40} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Waiting for Input</h3>
                  <p className="text-sm text-neutral-500 max-w-xs mx-auto">
                    Paste your notes on the left and click "Simplify Now" to see the magic happen.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-primary-600 font-bold text-sm">
                  <span>Learn faster with AI</span>
                  <ArrowRight size={16} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
