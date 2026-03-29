import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile } from './types';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import AssignmentDetail from './pages/AssignmentDetail';
import MockExam from './pages/MockExam';
import Attendance from './pages/Attendance';
import NotesSimplifierPage from './pages/NotesSimplifier';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="flex h-screen bg-neutral-50 overflow-hidden">
          {user && <Sidebar user={user} />}
          <div className="flex-1 flex flex-col overflow-hidden">
            {user && <Navbar user={user} />}
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
              <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
                
                <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
                <Route path="/courses/:courseId" element={user ? <CourseDetail user={user} /> : <Navigate to="/login" />} />
                <Route path="/assignments/:assignmentId" element={user ? <AssignmentDetail user={user} /> : <Navigate to="/login" />} />
                <Route path="/mock-exam" element={user ? <MockExam user={user} /> : <Navigate to="/login" />} />
                <Route path="/attendance" element={user ? <Attendance user={user} /> : <Navigate to="/login" />} />
                <Route path="/notes" element={user ? <NotesSimplifierPage user={user} /> : <Navigate to="/login" />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
