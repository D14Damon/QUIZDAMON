import React from 'react';
import { User } from 'firebase/auth';
import { signOutUser } from '../lib/authService';
import { UserProfile } from '../types';
import { 
  Sparkles, 
  Layout, 
  PlusCircle, 
  LogOut, 
  LogIn, 
  Sliders, 
  CheckCircle2, 
  BarChart3,
  User as UserIcon,
  Settings
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  profile: UserProfile | null;
  currentView: 'dashboard' | 'builder' | 'responses' | 'taker';
  activeQuizTitle?: string;
  onNavigate: (view: 'dashboard' | 'builder' | 'responses' | 'taker') => void;
  onOpenAuth: () => void;
  onCreateNewQuiz: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  profile,
  currentView,
  activeQuizTitle,
  onNavigate,
  onOpenAuth,
  onCreateNewQuiz,
  onOpenProfile,
}) => {
  const avatarUrl = profile?.photoBase64 || user?.photoURL;
  const displayName = profile?.displayName || user?.displayName || (user?.isAnonymous ? 'Guest Creator' : user?.email?.split('@')[0] || 'User');

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand: 𝓓𝓪𝓶𝓸𝓷-𝓠𝓤𝓘𝓩 with custom D•Q logo */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
          >
            <div className="w-8.5 h-8.5 rounded-xl bg-white border border-zinc-200 overflow-hidden flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform p-0.5 shrink-0">
              <img 
                src="/dq_logo.jpg" 
                alt="D•Q" 
                className="w-full h-full object-contain rounded-lg" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-zinc-900 tracking-tight text-lg">
                  𝓓𝓪𝓶𝓸𝓷-𝓠𝓤𝓘𝓩
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-600 rounded text-[10px] font-mono font-medium">
                  Studio
                </span>
              </div>
            </div>
          </button>

          {/* Navigation Links for creators */}
          <nav className="hidden md:flex items-center gap-1 border-l border-zinc-200 pl-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-zinc-100 text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              My Quizzes
            </button>

            {currentView === 'builder' && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                {activeQuizTitle ? `Editing: ${activeQuizTitle.slice(0, 24)}${activeQuizTitle.length > 24 ? '...' : ''}` : 'Quiz Designer'}
              </span>
            )}

            {currentView === 'responses' && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 text-white flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Responses & Analytics
              </span>
            )}

            {currentView === 'taker' && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Quiz View / Live Preview
              </span>
            )}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={onCreateNewQuiz}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                New Quiz
              </button>

              {/* User badge with profile click */}
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  title="Edit profile & photo"
                  className="flex items-center gap-2 p-1 pl-2 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer group text-left"
                >
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-bold text-zinc-900 leading-tight group-hover:text-black">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {user.isAnonymous ? 'Guest' : user.email || 'Signed In'}
                    </span>
                  </div>

                  {/* 500x500 base64 Avatar preview or fallback initials */}
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-200 border border-zinc-300 flex items-center justify-center text-xs font-bold text-zinc-700 shadow-2xs group-hover:ring-2 group-hover:ring-zinc-900 transition-all shrink-0">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={displayName} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="uppercase">
                        {displayName ? displayName[0] : 'U'}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => signOutUser()}
                  title="Sign Out"
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
