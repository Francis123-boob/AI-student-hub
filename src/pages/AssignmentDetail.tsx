import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { UserProfile, Assignment, Submission } from '../types';
import { 
  ChevronLeft,
  Clock,
  Calendar,
  FileText,
  Upload,
  Send,
  CheckCircle2,
  BrainCircuit,
  Loader2,
  Plus,
  ArrowRight
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { generateAssignmentPlan } from '../lib/gemini';
import { motion } from 'motion/react';

interface AssignmentDetailProps {
  user: UserProfile;
}

export default function AssignmentDetail({ user }: AssignmentDetailProps) {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [aiPlan, setAiPlan] = useState<{ task: string; time: string }[] | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  useEffect(() => {
    if (!assignmentId) return;

    const fetchAssignment = async () => {
      const docRef = doc(db, 'assignments', assignmentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAssignment({ id: docSnap.id, ...docSnap.data() } as Assignment);
      }
    };

    const q = query(collection(db, 'submissions'), where('assignmentId', '==', assignmentId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allSubmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
      setSubmissions(allSubmissions);
      const mine = allSubmissions.find(s => s.studentId === user.uid);
      if (mine) setMySubmission(mine);
    });

    fetchAssignment();
    return () => unsubscribe();
  }, [assignmentId, user.uid]);

  const handleGeneratePlan = async () => {
    if (!assignment) return;
    setLoadingPlan(true);
    try {
      const plan = await generateAssignmentPlan(assignment.description);
      setAiPlan(plan.steps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentId || !assignment) return;
    setSubmitting(true);
    try {
      let fileUrl = '';
      if (submissionFile) {
        const fileRef = ref(storage, `submissions/${assignmentId}/${user.uid}/${submissionFile.name}`);
        await uploadBytes(fileRef, submissionFile);
        fileUrl = await getDownloadURL(fileRef);
      }

      const submissionData = {
        assignmentId,
        studentId: user.uid,
        studentName: user.name,
        content: submissionText,
        fileUrl,
        status: 'submitted' as const,
        createdAt: new Date().toISOString()
      };

      if (mySubmission) {
        await setDoc(doc(db, 'submissions', mySubmission.id), submissionData);
      } else {
        await addDoc(collection(db, 'submissions'), submissionData);
      }
      
      setSubmissionText('');
      setSubmissionFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!assignment) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to={`/courses/${assignment.courseId}`} className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
          <ChevronLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">{assignment.title}</h1>
          <p className="text-neutral-500 mt-1">{assignment.courseTitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Assignment Description */}
          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-2xl font-bold text-sm">
                <Clock size={18} />
                Due {formatDate(assignment.deadline)}
              </div>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Instructions</h2>
            <p className="text-neutral-600 leading-relaxed max-w-2xl">{assignment.description}</p>
            
            <div className="mt-8 pt-8 border-t border-neutral-50 flex items-center gap-6">
              <div className="flex items-center gap-2 text-neutral-500 text-sm">
                <Calendar size={16} />
                Posted on {formatDate(assignment.createdAt)}
              </div>
              <div className="flex items-center gap-2 text-neutral-500 text-sm">
                <FileText size={16} />
                Weight: 20%
              </div>
            </div>
          </div>

          {/* AI Plan Section */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-8 rounded-3xl text-white shadow-xl shadow-primary-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <BrainCircuit size={24} />
                </div>
                <h2 className="text-xl font-bold">AI Task Planner</h2>
              </div>
              {!aiPlan && (
                <button 
                  onClick={handleGeneratePlan}
                  disabled={loadingPlan}
                  className="px-6 py-2 bg-white text-primary-700 rounded-xl font-bold hover:bg-primary-50 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loadingPlan ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  Generate Plan
                </button>
              )}
            </div>

            {aiPlan ? (
              <div className="space-y-4">
                {aiPlan.map((step, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{step.task}</p>
                      <p className="text-xs text-primary-100">{step.time}</p>
                    </div>
                    <CheckCircle2 size={20} className="text-primary-200" />
                  </motion.div>
                ))}
                <button 
                  onClick={() => setAiPlan(null)}
                  className="text-xs font-bold text-primary-100 hover:text-white transition-colors underline underline-offset-4"
                >
                  Regenerate plan
                </button>
              </div>
            ) : (
              <p className="text-primary-100 text-sm">
                Click the button to generate a step-by-step plan for this assignment using Gemini AI.
              </p>
            )}
          </div>

          {/* Submission Section for Students */}
          {user.role === 'student' && (
            <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-900">Your Submission</h2>
                {mySubmission && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    Submitted
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Submission Content</label>
                  <textarea 
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    className="w-full px-4 py-4 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 h-48 resize-none text-sm"
                    placeholder="Paste your assignment text here..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:flex-1 relative">
                    <input 
                      type="file" 
                      id="file-upload"
                      className="hidden"
                      onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="file-upload"
                      className="flex items-center justify-center gap-3 w-full px-4 py-3 border-2 border-dashed border-neutral-200 rounded-2xl text-sm font-medium text-neutral-500 hover:border-primary-400 hover:text-primary-600 transition-all cursor-pointer"
                    >
                      <Upload size={18} />
                      {submissionFile ? submissionFile.name : 'Upload PDF or DOCX'}
                    </label>
                  </div>
                  <button 
                    type="submit"
                    disabled={submitting || (!submissionText && !submissionFile)}
                    className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary-100"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    {mySubmission ? 'Resubmit' : 'Submit Now'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Submissions List for Lecturers */}
          {user.role === 'lecturer' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-neutral-900">Student Submissions ({submissions.length})</h2>
              <div className="grid grid-cols-1 gap-4">
                {submissions.map((sub) => (
                  <div key={sub.id} className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between group hover:border-primary-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-primary-600 font-bold">
                        {sub.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900">{sub.studentName}</p>
                        <p className="text-xs text-neutral-400">Submitted on {formatDate(sub.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {sub.fileUrl && (
                        <a 
                          href={sub.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-2 text-xs font-bold text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
                        >
                          View File
                        </a>
                      )}
                      <button className="px-4 py-2 text-xs font-bold text-neutral-600 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                        Grade
                      </button>
                    </div>
                  </div>
                ))}
                {submissions.length === 0 && (
                  <div className="text-center py-12 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200">
                    <p className="text-neutral-500">No submissions yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Quick Links */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
            <h3 className="font-bold text-neutral-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/mock-exam" className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 hover:bg-primary-50 group transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                    <BrainCircuit size={18} />
                  </div>
                  <span className="text-sm font-semibold text-neutral-700 group-hover:text-primary-700">Mock Exam</span>
                </div>
                <ArrowRight size={16} className="text-neutral-300 group-hover:text-primary-400" />
              </Link>
              <Link to="/notes" className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 hover:bg-primary-50 group transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                    <FileText size={18} />
                  </div>
                  <span className="text-sm font-semibold text-neutral-700 group-hover:text-emerald-700">Notes Simplifier</span>
                </div>
                <ArrowRight size={16} className="text-neutral-300 group-hover:text-emerald-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
