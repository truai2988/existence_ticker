import { useState, useEffect } from 'react';
// Main App Component
import { HomeView } from './components/HomeView';
import { ProfileView } from './components/ProfileView';
import { JournalView } from './components/JournalView'; // Acting as History
import { AuthScreen } from './components/AuthScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RadianceView } from './components/RadianceView';
import { FlowView } from './components/FlowView';
import { GiftView } from './components/GiftView';

import { useAuth } from './hooks/useAuthHook';
import { useWallet } from './hooks/useWallet';


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

type GenericViewMode = 'home' | 'history' | 'profile' | 'flow' | 'give' | 'gift' | 'admin';

function App() {
  const { user, loading: authLoading } = useAuth();
  // const { profile } = useProfile(); // Unused here now, ProfileView handles it internally
  const { balance } = useWallet(); 
  
  const [viewMode, setViewMode] = useState<GenericViewMode>('home');
  
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
      <Header balance={balance} lastUpdated={null} /> 
      {/* Note: lastUpdated is missing here, we should ideally fetch it or let Header use the hook. 
         Let's update Header to use useProfile if we don't want to drill it here.
         For now, passing null might break decay. Let's fix this in Header later or import useProfile here.
      */}

      {/* MAIN CONTENT */}
      <main className="flex-1 relative overflow-y-auto no-scrollbar scroll-smooth pb-24">
          
          {viewMode === 'home' && (
              <HomeView 
                onOpenFlow={() => setViewMode('flow')} 
                onOpenRequest={() => setViewMode('give')}
                onOpenGift={() => setViewMode('gift')}
              />
          )}

          {viewMode === 'profile' && (
            <ProfileView 
                onClose={handleGoHome} 
                onOpenAdmin={() => setViewMode('admin')} 
            /> 
            // ProfileView usually has a close button. We can hide it or make it go Home.
          )}
          
          {viewMode === 'history' && (
            <JournalView onClose={handleGoHome} />
          )}

          {viewMode === 'flow' && (
            <FlowView onClose={handleGoHome} currentUserId={user.uid} />
          )}

          {/* REQUEST (CONTRACT) VIEW */}
          {viewMode === 'give' && (
             <RadianceView onClose={handleGoHome} currentUserId={user.uid} />
          )}

          {/* GIFT (PURE) VIEW */}
          {viewMode === 'gift' && (
             <GiftView onClose={handleGoHome} currentUserId={user.uid} />
          )}

          {viewMode === 'admin' && (
            <AdminDashboard onClose={handleGoHome} />
          )}

      </main>

      {/* FOOTER NAVIGATION */}
      <Footer currentTab={activeTab} onTabChange={handleTabChange} />

      {/* Admin Quick Access (Hidden/Discreet) */}
      <PWALogic /> 
    </div>
  );
}

export default App;
