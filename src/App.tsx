import { useState } from 'react';
// Main App Component
import { Scan, Sparkles } from 'lucide-react';

import { TopScreen } from './components/TopScreen';
import { WishesList } from './components/WishesList';
import { ProfileView } from './components/ProfileView';
import { JournalView } from './components/JournalView';
import { AuthScreen } from './components/AuthScreen';
import { AdminDashboard } from './components/AdminDashboard';

import { useAuth } from './hooks/useAuthHook';
import { useWallet } from './hooks/useWallet';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { balance } = useWallet();

  const [currentTab, setCurrentTab] = useState<'flow' | 'wishes'>('flow');
  const [activeOverlay, setActiveOverlay] = useState<'none' | 'profile' | 'journal' | 'admin'>('none');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-pulse tracking-widest text-xs uppercase text-yellow-500">
          Connecting to Existence...
        </div>
      </div>
    );
  }

  if (!user) {
      return <AuthScreen />;
  }

  return (
    <div className="bg-black min-h-screen text-white pb-24 font-sans selection:bg-yellow-500/30 overflow-hidden flex flex-col">
      
      <main className="flex-1 relative w-full h-full overflow-hidden">
        {currentTab === 'flow' ? (
          <div className="animate-in fade-in duration-500 h-full overflow-y-auto flex flex-col">
            {/* TopScreenにデータを渡す */}
            <TopScreen 
              balance={balance}
              onOpenProfile={() => setActiveOverlay('profile')}
              onOpenJournal={() => setActiveOverlay('journal')}
              onOpenAdmin={() => setActiveOverlay('admin')}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 h-full overflow-hidden">
            <WishesList currentUserId={user.uid} />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 safe-area-bottom">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button 
            onClick={() => setCurrentTab('flow')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              currentTab === 'flow' ? 'text-yellow-400 scale-105' : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            <Scan className="w-6 h-6" />
            <span className="text-[9px] font-mono tracking-[0.2em]">FLOW</span>
          </button>

          <button 
            onClick={() => setCurrentTab('wishes')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              currentTab === 'wishes' ? 'text-yellow-400 scale-105' : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-[9px] font-mono tracking-[0.2em]">WISHES</span>
          </button>
        </div>
      </nav>

      {activeOverlay === 'profile' && (
        <ProfileView onClose={() => setActiveOverlay('none')} />
      )}
      {activeOverlay === 'journal' && (
        <JournalView onClose={() => setActiveOverlay('none')} />
      )}
      {activeOverlay === 'admin' && (
        <AdminDashboard onClose={() => setActiveOverlay('none')} />
      )}

    </div>
  );
}

export default App;