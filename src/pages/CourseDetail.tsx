import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Course, Assignment } from '../types';
import { 
  Plus, 
  BookOpen, 
  Clock, 
  Calendar,
  ChevronLeft,
  Users,
  FileText,
  MoreVertical
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { motion } from 'motion/react';

interface CourseDetailProps {
  user: UserProfile;
}

export default function CourseDetail({ user }: CourseDetailProps) {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      const docRef = doc(db, 'courses', courseId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCourse({ id: docSnap.id, ...docSnap.data() } as Course);
      }
    };

    const q = query(collection(db, 'assignments'), where('courseId', '==', courseId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment)));
    });

    fetchCourse();
    return () => unsubscribe();
  }, [courseId]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !course) return;
    try {
      await addDoc(collection(db, 'assignments'), {
        courseId,
        courseTitle: course.title,
        title: newTitle,
        description: newDesc,
        deadline: newDeadline,
        createdAt: new Date().toISOString()
      });
      setShowCreateAssignment(false);
      setNewTitle('');
      setNewDesc('');
      setNewDeadline('');
    } catch (err) {
      console.error(err);
    }
  };

  if (!course) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
          <ChevronLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">{course.title}</h1>
          <p className="text-neutral-500 mt-1">Lecturer: {course.lecturerName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Course Info */}
          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Course Overview</h2>
            <p className="text-neutral-600 leading-relaxed">{course.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-neutral-50">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Students</span>
                <div className="flex items-center gap-2 text-neutral-900 font-bold">
                  <Users size={18} className="text-primary-500" />
                  <span>12</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Assignments</span>
                <div className="flex items-center gap-2 text-neutral-900 font-bold">
                  <FileText size={18} className="text-amber-500" />
                  <span>{assignments.length}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Created</span>
                <div className="flex items-center gap-2 text-neutral-900 font-bold">
                  <Calendar size={18} className="text-emerald-500" />
                  <span>{formatDate(course.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assignments List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Course Assignments</h2>
              {user.role === 'lecturer' && (
                <button 
                  onClick={() => setShowCreateAssignment(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
                >
                  <Plus size={18} />
                  New Assignment
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.map((assignment, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={assignment.id}
                  className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                      <ClipboardList size={24} />
                    </div>
                    <button className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">{assignment.title}</h3>
                  <p className="text-sm text-neutral-500 line-clamp-2 mb-4">{assignment.description}</p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-50">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                      <Clock size={14} />
                      Due {formatDate(assignment.deadline)}
                    </div>
                    <Link to={`/assignments/${assignment.id}`} className="text-sm font-bold text-primary-600 hover:text-primary-700">
                      Details
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Course Resources */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-neutral-900">Course Resources</h2>
          <div className="space-y-4">
            {[
              { label: 'Syllabus.pdf', size: '1.2 MB', type: 'PDF' },
              { label: 'Lecture_Notes_01.pdf', size: '4.5 MB', type: 'PDF' },
              { label: 'Reading_List.docx', size: '245 KB', type: 'DOCX' },
            ].map((resource, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between group hover:border-primary-200 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-400 group-hover:text-primary-600 transition-colors">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900">{resource.label}</p>
                    <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">{resource.type} • {resource.size}</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-primary-600 hover:text-primary-700">Download</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showCreateAssignment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">New Assignment</h2>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Assignment title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Description</label>
                <textarea 
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 h-32 resize-none"
                  placeholder="Task details..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Deadline</label>
                <input 
                  type="date" 
                  required
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateAssignment(false)}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-neutral-600 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-100"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

import { ClipboardList } from 'lucide-react';
