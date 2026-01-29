import { useState, useEffect } from 'react';
// Main App Component
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MainContent } from './components/MainContent'; 

import { useAuth } from './hooks/useAuthHook';
import { useWallet } from './hooks/useWallet';
import { AppViewMode } from './types'; 

import { useRegisterSW } from 'virtual:pwa-register/react';

const PWALogic = () => {
    useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });
    return null;
};

function App() {
  const { user, loading: authLoading } = useAuth();
  
  const [viewMode, setViewMode] = useState<AppViewMode>('home');
  
  // Tab state (Visual mostly, syncing with viewMode)
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile'>('home');

  const handleTabChange = (tab: 'home' | 'history' | 'profile') => {
      setActiveTab(tab);
      setViewMode(tab);
  };

  const { checkLunarPhase } = useWallet();

  // Lunar Phase Logic (Preserved from TopScreen)
  useEffect(() => {
      if (!user) return;
      const doCheck = async () => {
          await checkLunarPhase();
      };
      doCheck();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleGoHome = () => {
      setActiveTab('home');
      setViewMode('home');
  };

  const handleOpenWishHub = () => {
      setViewMode('give'); // RadianceView = 自分のお願い画面
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="animate-pulse tracking-widest text-xs uppercase text-slate-400">
          Connecting to Existence...
        </div>
      </div>
    );
  }

  if (!user) {
      return <AuthScreen />;
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans selection:bg-yellow-500/30 overflow-hidden flex flex-col relative text-slate-900">
      
      {/* HEADER (Always visible except maybe Admin?) */}
      <Header onOpenWishHub={handleOpenWishHub} /> 

      {/* MAIN CONTENT */}
      <main className="flex-1 relative overflow-y-auto no-scrollbar scroll-smooth pb-24 flex flex-col">
          <MainContent 
            viewMode={viewMode} 
            setViewMode={setViewMode} 
            currentUserId={user.uid} 
            onGoHome={handleGoHome} 
          />
      </main>

      {/* FOOTER NAVIGATION */}
      <Footer currentTab={activeTab} onTabChange={handleTabChange} />

      {/* Admin Quick Access (Hidden/Discreet) */}
      <PWALogic /> 
    </div>
  );
}

export default App;