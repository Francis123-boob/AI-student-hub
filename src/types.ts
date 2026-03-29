export type UserRole = 'student' | 'lecturer' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Course {
  id: string;
  lecturerId: string;
  lecturerName: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  deadline: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content: string;
  fileUrl?: string;
  status: 'submitted' | 'pending';
  createdAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  date: string;
  status: 'Present' | 'Absent';
}

export interface MockExam {
  mcqs: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
  shortAnswers: {
    question: string;
    sampleAnswer: string;
  }[];
}
