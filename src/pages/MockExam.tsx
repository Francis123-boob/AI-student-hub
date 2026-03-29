import { useState, useEffect } from 'react';
import { UserProfile, MockExam as MockExamType } from '../types';
import { 
  BrainCircuit, 
  Loader2, 
  Timer, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  ChevronRight,
  HelpCircle,
  FileText,
  Upload
} from 'lucide-react';
import { generateMockExam } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';

interface MockExamProps {
  user: UserProfile;
}

export default function MockExam({ user }: MockExamProps) {
  const [content, setContent] = useState('');
  const [exam, setExam] = useState<MockExamType | null>(null);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(10); // minutes
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (examStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (examStarted && timeLeft === 0) {
      handleFinishExam();
    }
    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  const handleGenerateExam = async () => {
    if (!content) return;
    setLoading(true);
    try {
      const generatedExam = await generateMockExam(content);
      setExam(generatedExam);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    setExamStarted(true);
    setTimeLeft(duration * 60);
    setExamFinished(false);
    setAnswers({});
    setShortAnswers({});
  };

  const handleFinishExam = () => {
    setExamStarted(false);
    setExamFinished(true);
    
    // Calculate score
    let correct = 0;
    exam?.mcqs.forEach((mcq, i) => {
      if (answers[i] === mcq.correctAnswer) {
        correct++;
      }
    });
    setScore(correct);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (examFinished) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white p-12 rounded-3xl border border-neutral-100 shadow-xl text-center">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Exam Completed!</h1>
          <p className="text-neutral-500 mb-8">You've successfully finished the mock exam.</p>
          
          <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto mb-12">
            <div className="bg-neutral-50 p-6 rounded-2xl">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Score</p>
              <p className="text-3xl font-bold text-primary-600">{score} / {exam?.mcqs.length}</p>
            </div>
            <div className="bg-neutral-50 p-6 rounded-2xl">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Accuracy</p>
              <p className="text-3xl font-bold text-emerald-600">
                {Math.round((score / (exam?.mcqs.length || 1)) * 100)}%
              </p>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Review Answers</h2>
            {exam?.mcqs.map((mcq, i) => (
              <div key={i} className={`p-4 rounded-2xl border ${answers[i] === mcq.correctAnswer ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <p className="font-bold text-sm mb-2">{i + 1}. {mcq.question}</p>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1">
                    Your answer: <span className="font-bold">{answers[i] || 'None'}</span>
                    {answers[i] === mcq.correctAnswer ? <CheckCircle2 size={14} className="text-emerald-600" /> : <XCircle size={14} className="text-red-600" />}
                  </span>
                  <span className="text-neutral-500">Correct: <span className="font-bold text-emerald-600">{mcq.correctAnswer}</span></span>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => {
              setExam(null);
              setExamFinished(false);
              setContent('');
            }}
            className="mt-12 px-8 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
          >
            Try Another Topic
          </button>
        </div>
      </div>
    );
  }

  if (examStarted && exam) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-24">
        <div className="sticky top-4 z-10 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-neutral-100 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
              <BrainCircuit size={20} />
            </div>
            <h2 className="font-bold text-neutral-900">Mock Exam in Progress</h2>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-amber-50 text-amber-600'}`}>
            <Timer size={20} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="space-y-12">
          {/* MCQs */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <span className="w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center text-sm">1</span>
              Multiple Choice Questions
            </h3>
            <div className="space-y-8">
              {exam.mcqs.map((mcq, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
                  <p className="text-lg font-bold text-neutral-900 mb-6">{i + 1}. {mcq.question}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mcq.options.map((option, j) => (
                      <button
                        key={j}
                        onClick={() => setAnswers({ ...answers, [i]: option })}
                        className={`p-4 text-left rounded-2xl border-2 transition-all font-medium ${
                          answers[i] === option 
                            ? 'border-primary-600 bg-primary-50 text-primary-700' 
                            : 'border-neutral-50 bg-neutral-50 text-neutral-600 hover:border-neutral-200'
                        }`}
                      >
                        <span className="inline-block w-6 h-6 rounded-full bg-white border border-neutral-200 text-center text-xs leading-6 mr-3">
                          {String.fromCharCode(65 + j)}
                        </span>
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Short Answers */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <span className="w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center text-sm">2</span>
              Short Answer Questions
            </h3>
            <div className="space-y-8">
              {exam.shortAnswers.map((sa, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
                  <p className="text-lg font-bold text-neutral-900 mb-4">{i + 1}. {sa.question}</p>
                  <textarea
                    value={shortAnswers[i] || ''}
                    onChange={(e) => setShortAnswers({ ...shortAnswers, [i]: e.target.value })}
                    className="w-full px-4 py-4 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 h-32 resize-none text-sm"
                    placeholder="Type your answer here..."
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4">
          <button 
            onClick={handleFinishExam}
            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-2xl shadow-primary-200 flex items-center justify-center gap-2"
          >
            Submit Exam
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">AI Mock Exam Generator</h1>
          <p className="text-neutral-500 mt-1">Generate custom exams from your study materials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
            <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <FileText size={20} className="text-primary-600" />
              Study Content
            </h2>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-4 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 h-64 resize-none text-sm mb-6"
              placeholder="Paste course content, notes, or key topics here..."
            />
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:flex-1 relative">
                <input type="file" id="exam-file" className="hidden" />
                <label 
                  htmlFor="exam-file"
                  className="flex items-center justify-center gap-3 w-full px-4 py-3 border-2 border-dashed border-neutral-200 rounded-2xl text-sm font-medium text-neutral-500 hover:border-primary-400 hover:text-primary-600 transition-all cursor-pointer"
                >
                  <Upload size={18} />
                  Upload PDF Notes
                </label>
              </div>
              <button 
                onClick={handleGenerateExam}
                disabled={loading || !content}
                className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary-100"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
                Generate Exam
              </button>
            </div>
          </div>

          <AnimatePresence>
            {exam && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 rounded-3xl text-white shadow-xl shadow-emerald-100"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                      <CheckCircle2 size={24} />
                    </div>
                    <h2 className="text-xl font-bold">Exam Ready!</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                      <Timer size={18} />
                      <select 
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="bg-transparent font-bold focus:outline-none cursor-pointer"
                      >
                        <option value={10} className="text-neutral-900">10 mins</option>
                        <option value={20} className="text-neutral-900">20 mins</option>
                        <option value={30} className="text-neutral-900">30 mins</option>
                        <option value={60} className="text-neutral-900">60 mins</option>
                      </select>
                    </div>
                    <button 
                      onClick={handleStartExam}
                      className="px-8 py-2 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition-all flex items-center gap-2"
                    >
                      Start Now
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                    <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">MCQs</p>
                    <p className="text-2xl font-bold">{exam.mcqs.length}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                    <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">Short Answers</p>
                    <p className="text-2xl font-bold">{exam.shortAnswers.length}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
            <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <HelpCircle size={18} className="text-neutral-400" />
              How it works
            </h3>
            <ul className="space-y-4">
              {[
                'Paste your study notes or upload a PDF.',
                'AI analyzes the content and creates questions.',
                'Set your preferred exam duration.',
                'Take the timed test and get instant feedback.'
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-neutral-600">
                  <span className="font-bold text-primary-600">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
