import { useState, useEffect, Suspense, lazy } from "react";
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
import { useWallet } from "./hooks/useWallet";
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

function App() {
  const { user, loading: authLoading } = useAuth();
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

  const { checkLunarPhase } = useWallet();

  // Lunar Phase Logic (Preserved from TopScreen)
  useEffect(() => {
    if (!user) return;
    const doCheck = async () => {
      await checkLunarPhase();
    };
    // Short delay to allow UI to settle first (Optimization)
    const timer = setTimeout(doCheck, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleGoHome = () => {
    setActiveTab("home");
    setViewMode("home");
  };

  const handleOpenWishHub = () => {
    setViewMode("give"); // RadianceView = 自分のお願い画面
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
    <div className="bg-slate-50 h-screen font-sans selection:bg-yellow-500/30 overflow-hidden flex flex-col relative text-slate-900">
      {/* HEADER (Always visible except maybe Admin?) */}
      <Header onOpenWishHub={handleOpenWishHub} viewMode={viewMode} />

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
