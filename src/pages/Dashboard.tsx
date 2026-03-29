import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Course, Assignment } from '../types';
import { 
  Plus, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/utils';
import { motion } from 'motion/react';

interface DashboardProps {
  user: UserProfile;
}

export default function Dashboard({ user }: DashboardProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  useEffect(() => {
    // Fetch courses
    const coursesQuery = user.role === 'lecturer' 
      ? query(collection(db, 'courses'), where('lecturerId', '==', user.uid))
      : query(collection(db, 'courses'));

    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    });

    // Fetch assignments
    const assignmentsQuery = query(collection(db, 'assignments'));
    const unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment)));
    });

    return () => {
      unsubscribeCourses();
      unsubscribeAssignments();
    };
  }, [user]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'courses'), {
        lecturerId: user.uid,
        lecturerName: user.name,
        title: newCourseTitle,
        description: newCourseDesc,
        createdAt: new Date().toISOString()
      });
      setShowCreateCourse(false);
      setNewCourseTitle('');
      setNewCourseDesc('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Academic Dashboard</h1>
          <p className="text-neutral-500 mt-1">Manage your courses and assignments effectively.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all w-64"
            />
          </div>
          {user.role === 'lecturer' && (
            <button 
              onClick={() => setShowCreateCourse(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
            >
              <Plus size={18} />
              Create Course
            </button>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Courses', value: courses.length, icon: BookOpen, color: 'bg-blue-500' },
          { label: 'Pending Tasks', value: assignments.length, icon: Clock, color: 'bg-amber-500' },
          { label: 'Upcoming Deadlines', value: '3', icon: Calendar, color: 'bg-emerald-500' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-5"
          >
            <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg shadow-neutral-100`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
              <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900">Your Courses</h2>
            <button className="text-sm font-semibold text-primary-600 hover:text-primary-700">View all</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={course.id}
                className="group bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                    <BookOpen size={24} />
                  </div>
                  <Link to={`/courses/${course.id}`} className="p-2 text-neutral-400 hover:text-primary-600 transition-colors">
                    <ChevronRight size={20} />
                  </Link>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">{course.title}</h3>
                <p className="text-sm text-neutral-500 line-clamp-2 mb-4">{course.description}</p>
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                  <span className="px-2 py-1 bg-neutral-50 rounded-md">12 Students</span>
                  <span className="px-2 py-1 bg-neutral-50 rounded-md">4 Assignments</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar Content: Recent Assignments */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900">Recent Tasks</h2>
            <Filter size={18} className="text-neutral-400 cursor-pointer" />
          </div>

          <div className="space-y-4">
            {assignments.slice(0, 5).map((assignment, i) => (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={assignment.id}
                className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm hover:border-primary-200 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                    {assignment.courseTitle}
                  </span>
                  <span className="text-xs text-neutral-400">{formatDate(assignment.deadline)}</span>
                </div>
                <h4 className="font-bold text-neutral-900 text-sm mb-1">{assignment.title}</h4>
                <p className="text-xs text-neutral-500 line-clamp-1">{assignment.description}</p>
                <Link to={`/assignments/${assignment.id}`} className="mt-3 w-full flex items-center justify-center py-2 text-xs font-semibold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                  View Details
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Course Modal */}
      {showCreateCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Create New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Course Title</label>
                <input 
                  type="text" 
                  required
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Advanced Mathematics"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Description</label>
                <textarea 
                  required
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 h-32 resize-none"
                  placeholder="Course overview..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateCourse(false)}
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
