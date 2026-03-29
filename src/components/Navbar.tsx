import { LogOut, User, Bell } from 'lucide-react';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile;
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-neutral-800 hidden md:block">
          Welcome back, {user.name}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-neutral-900">{user.name}</p>
            <p className="text-xs text-neutral-500 capitalize">{user.role}</p>
          </div>
          <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
