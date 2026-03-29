import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  GraduationCap, 
  QrCode, 
  FileText,
  Settings,
  BrainCircuit
} from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  user: UserProfile;
}

export default function Sidebar({ user }: SidebarProps) {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: GraduationCap, label: 'Courses', path: '/courses' },
    { icon: ClipboardList, label: 'Assignments', path: '/assignments' },
    { icon: BrainCircuit, label: 'Mock Exams', path: '/mock-exam' },
    { icon: QrCode, label: 'Attendance', path: '/attendance' },
    { icon: FileText, label: 'Notes Simplifier', path: '/notes' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col h-full shrink-0">
      <div className="p-6 h-16 flex items-center border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="text-xl font-bold text-neutral-900 tracking-tight">Hub</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-primary-50 text-primary-700 font-medium" 
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            )}
          >
            <item.icon size={20} className={cn(
              "transition-colors",
              "group-hover:text-primary-600"
            )} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-200">
        <div className="bg-neutral-50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
              <User size={16} className="text-neutral-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-900 truncate w-32">{user.name}</p>
              <p className="text-[10px] text-neutral-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
            <Settings size={14} />
            Settings
          </button>
        </div>
      </div>
    </aside>
  );
}

import { User } from 'lucide-react';
