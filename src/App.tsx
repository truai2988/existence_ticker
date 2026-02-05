import { useState, Suspense, lazy, useEffect } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { motion } from "framer-motion";
// Main App Component
import { AuthScreen } from "./components/AuthScreen";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

// Lazy Load Main Logic to improve initial render speed
const MainContent = lazy(() =>
  import("./components/MainContent").then((module) => ({
    default: module.MainContent,
  })),
);
const AdminDashboard = lazy(() =>
  import("./components/AdminDashboard").then((module) => ({
    default: module.AdminDashboard,
  })),
);

import { useAuth } from "./hooks/useAuthHook";
// import { useProfile } from './hooks/useProfile';
// import { useWallet } from "./hooks/useWallet";
import { AppViewMode } from "./types";
// import { ADMIN_UIDS } from './constants';

import { useRegisterSW } from "virtual:pwa-register/react";

const PWALogic = () => {
  useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: " + r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });
  return null;
};

// Loading Fallback: "White Porcelain" Aesthetic
const ScreenLoader = () => (
    <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 min-h-screen">
         <div className="relative flex items-center justify-center">
            {/* Soft Pulse */}
            <div className="absolute w-12 h-12 bg-slate-200 rounded-full animate-ping opacity-20"></div>
            {/* Core Vessel */}
            <div className="w-3 h-3 bg-white border border-slate-100 rounded-full shadow-sm animate-pulse z-10"></div>
         </div>
    </div>
);

// Cleanup Script Import
import { cleanupDuplicates } from './logic/cleanupDuplicates';
import { auditGravity, auditAllGravity, analyzeShiro } from './logic/auditGravity';
import { db } from './lib/firebase';
import { Firestore } from 'firebase/firestore';

function App() {
  const { user, loading: authLoading } = useAuth();
  
  // Expose Cleanup Script to Console
  useEffect(() => {
    if (user && db) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).cleanup = () => cleanupDuplicates(db as Firestore);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).audit = () => auditGravity(db as Firestore, user.uid);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).auditAll = () => auditAllGravity(db as Firestore);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).shiro = () => analyzeShiro(db as Firestore);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).shiroDebug = () => {
             import('./logic/auditGravity').then(m => m.debugShiroRebirth(db as Firestore));
        };
        
        console.log("Console Tools Ready:");
        console.log("- cleanup(): Deduplicate transactions");
        console.log("- audit(): Fix current user gravity leak");
        console.log("- auditAll(): Fix GLOBAL gravity leaks");
        console.log("- shiro(): Investigate SHIRO TAMAKI");
    }
  }, [user]);

  // const { profile } = useProfile();
  // const isAdmin = profile?.role === 'admin' || (user && ADMIN_UIDS.includes(user.uid));

  const [viewMode, setViewMode] = useState<AppViewMode>("home");
  const [showAdmin, setShowAdmin] = useState(false);

  // Tab state (Visual mostly, syncing with viewMode)
  const [activeTab, setActiveTab] = useState<"home" | "history" | "profile">(
    "home",
  );

  const handleTabChange = (tab: "home" | "history" | "profile") => {
    setActiveTab(tab);
    setViewMode(tab);
  };

  // Lunar Phase Logic (Metabolism) is now handled manually in HomeView
  // const { checkLunarPhase } = useWallet();

  const handleGoHome = () => {
    setActiveTab("home");
    setViewMode("home");
  };



  const [connectTimeout, setConnectTimeout] = useState(false);

  useEffect(() => {
    if (authLoading) {
      const timer = setTimeout(() => {
        setConnectTimeout(true);
      }, 10000); // 10 seconds timeout
      return () => clearTimeout(timer);
    } else {
      setConnectTimeout(false);
    }
  }, [authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="relative mb-8">
            <div className="w-12 h-12 bg-slate-200 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-pulse"></div>
            </div>
        </div>
        
        <div className="animate-pulse tracking-widest text-xs uppercase text-slate-400 font-bold">
          Connecting to Existence...
        </div>

        {connectTimeout && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-center"
            >
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                    接続に時間がかかっています。<br/>
                    通信環境を確認するか、再試行してください。
                </p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                >
                    再読み込みする
                </button>
            </motion.div>
        )}
      </div>
    );
  }

  if (!user) {
    return (
        <ErrorBoundary>
            <AuthScreen />
        </ErrorBoundary>
    );
  }

  return (
    <div className="bg-slate-50 h-screen font-sans selection:bg-yellow-500/30 overflow-hidden flex flex-col relative text-slate-900">
      {/* HEADER (Always visible except maybe Admin?) */}
      <Header viewMode={viewMode} />

      {/* MAIN CONTENT */}
      <main
        className={`flex-1 relative overflow-y-auto no-scrollbar scroll-smooth flex flex-col ${
          viewMode === "home" ? "pb-16" : "pb-24"
        }`}
      >
        <Suspense fallback={<ScreenLoader />}>
          <MainContent
            viewMode={viewMode}
            setViewMode={setViewMode}
            currentUserId={user.uid}
            onGoHome={handleGoHome}
          />
        </Suspense>
      </main>

      {/* FOOTER NAVIGATION */}
      <Footer currentTab={activeTab} onTabChange={handleTabChange} />

      {/* Admin Quick Access */}
      <PWALogic />

      {/* Dynamic Admin Loading */}
      {showAdmin && (
        <Suspense fallback={null}>
          <AdminDashboard onClose={() => setShowAdmin(false)} />
        </Suspense>
      )}
    </div>
  );
}

export default App;
