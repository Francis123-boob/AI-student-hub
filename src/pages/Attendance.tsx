import { useState, useEffect } from 'react';
import { UserProfile, Course, Attendance } from '../types';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Users,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../lib/utils';

interface AttendanceProps {
  user: UserProfile;
}

export default function AttendancePage({ user }: AttendanceProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = user.role === 'lecturer' 
      ? query(collection(db, 'courses'), where('lecturerId', '==', user.uid))
      : query(collection(db, 'courses'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!selectedCourse) return;

    const q = query(collection(db, 'attendance'), where('courseId', '==', selectedCourse));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAttendanceRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
    });

    return () => unsubscribe();
  }, [selectedCourse]);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);

      return () => {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      };
    }
  }, [scanning]);

  async function onScanSuccess(decodedText: string) {
    setScanning(false);
    setScanResult(decodedText);
    setLoading(true);
    setError(null);

    try {
      const data = JSON.parse(decodedText);
      if (data.lecturerId && data.courseId) {
        // Check if already marked for today
        const today = new Date().toISOString().split('T')[0];
        const q = query(
          collection(db, 'attendance'), 
          where('studentId', '==', user.uid),
          where('courseId', '==', data.courseId),
          where('date', '==', today)
        );
        const existing = await getDocs(q);

        if (existing.empty) {
          await addDoc(collection(db, 'attendance'), {
            studentId: user.uid,
            studentName: user.name,
            courseId: data.courseId,
            date: today,
            status: 'Present'
          });
        } else {
          setError('Attendance already marked for today.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Invalid QR Code.');
    } finally {
      setLoading(false);
    }
  }

  function onScanFailure(error: any) {
    // console.warn(`Code scan error = ${error}`);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Attendance System</h1>
          <p className="text-neutral-500 mt-1">
            {user.role === 'lecturer' ? 'Manage student attendance via QR code.' : 'Scan QR code to mark your attendance.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: QR Actions */}
        <div className="lg:col-span-2 space-y-6">
          {user.role === 'lecturer' ? (
            <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm text-center">
              <h2 className="text-xl font-bold text-neutral-900 mb-6">Generate Attendance QR</h2>
              <div className="max-w-xs mx-auto space-y-6">
                <select 
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>

                {selectedCourse && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 bg-neutral-50 rounded-3xl border border-neutral-100 inline-block"
                  >
                    <QRCodeSVG 
                      value={JSON.stringify({ lecturerId: user.uid, courseId: selectedCourse })} 
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                    <p className="mt-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Scan to mark attendance</p>
                  </motion.div>
                )}
                {!selectedCourse && (
                  <div className="p-12 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200 flex flex-col items-center gap-3 text-neutral-400">
                    <QrCode size={48} />
                    <p className="text-sm">Select a course to generate QR</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm text-center">
              <h2 className="text-xl font-bold text-neutral-900 mb-6">Mark Attendance</h2>
              
              <AnimatePresence mode="wait">
                {scanning ? (
                  <motion.div 
                    key="scanner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="max-w-sm mx-auto overflow-hidden rounded-3xl border-4 border-primary-100"
                  >
                    <div id="reader"></div>
                    <button 
                      onClick={() => setScanning(false)}
                      className="w-full py-3 bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                    >
                      Cancel Scan
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="w-32 h-32 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-primary-100">
                      <Camera size={48} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">Ready to Scan?</h3>
                      <p className="text-sm text-neutral-500 mt-1">Point your camera at the lecturer's QR code.</p>
                    </div>
                    <button 
                      onClick={() => setScanning(true)}
                      className="px-12 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 flex items-center gap-2 mx-auto"
                    >
                      <QrCode size={20} />
                      Open Scanner
                    </button>

                    {loading && (
                      <div className="flex items-center justify-center gap-2 text-primary-600 font-bold">
                        <Loader2 className="animate-spin" size={20} />
                        Processing...
                      </div>
                    )}

                    {error && (
                      <div className="max-w-xs mx-auto p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                        <AlertCircle size={18} />
                        {error}
                      </div>
                    )}

                    {scanResult && !error && !loading && (
                      <div className="max-w-xs mx-auto p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm border border-emerald-100 flex items-center gap-2">
                        <CheckCircle2 size={18} />
                        Attendance marked successfully!
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Attendance History/Dashboard */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Attendance Records</h2>
              <div className="flex items-center gap-2">
                <select 
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="">All Courses</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-xs font-bold text-neutral-600">
                            {record.studentName.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-neutral-900">{record.studentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500">{formatDate(record.date)}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-neutral-400 hover:text-primary-600 transition-colors">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {attendanceRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-neutral-400">
                        No attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Stats */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
            <h3 className="font-bold text-neutral-900 mb-6">Overview</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Students</p>
                  <p className="text-xl font-bold text-neutral-900">48</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Avg. Attendance</p>
                  <p className="text-xl font-bold text-neutral-900">92%</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Late Arrivals</p>
                  <p className="text-xl font-bold text-neutral-900">5%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
            <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-neutral-400" />
              Upcoming Sessions
            </h3>
            <div className="space-y-4">
              {[
                { time: '09:00 AM', course: 'Advanced Math', room: 'L-204' },
                { time: '11:30 AM', course: 'Data Structures', room: 'Lab-3' },
                { time: '02:00 PM', course: 'Web Dev', room: 'Online' },
              ].map((session, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50">
                  <div>
                    <p className="text-xs font-bold text-primary-600">{session.time}</p>
                    <p className="text-sm font-bold text-neutral-900">{session.course}</p>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400 bg-white px-2 py-1 rounded-lg border border-neutral-100">
                    {session.room}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
