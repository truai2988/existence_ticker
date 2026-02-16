import React, { useState, Suspense, lazy, useEffect } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";
import { AuthScreen } from "./components/AuthScreen";
import { Header } from "./components/Header";
import { ProfileView } from "./components/ProfileView";
import { JournalView } from "./components/JournalView";
import { HomeView } from "./components/HomeView";
import { RadianceView } from "./components/RadianceView";
import { FlowView } from "./components/FlowView";
import { OnboardingStory } from "./components/OnboardingStory";
import { AppViewMode } from "./types";
import { useStartupMachine, AppMode } from "./hooks/useStartupMachine";
import { useWallet } from "./hooks/useWallet";

// カウントアップ・ダウン演出
const CountingNumber: React.FC<{ value: number; duration: number }> = ({
  value,
  duration,
}) => {
  const [display, setDisplay] = useState(2400);

  useEffect(() => {
    const start = 2400;
    const end = value;
    const startTime = Date.now();

    const update = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      // Ease out quintic
      const ease = 1 - Math.pow(1 - progress, 5);

      const current = Math.floor(start - (start - end) * ease);
      setDisplay(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }, [value, duration]);

  return (
    <div className="text-6xl font-serif font-bold text-slate-900 tracking-tighter">
      {display.toLocaleString()}
    </div>
  );
};

// 1. Ritual Overlay (Global Layer)
const RitualOverlay = ({
  state,
  targetBalance,
}: {
  state: string;
  targetBalance: number;
}) => (
  <AnimatePresence>
    {state !== "idle" && (
      <motion.div
        className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Backdrop Blur & Brightness */}
        <div
          className={`absolute inset-0 bg-white/90 backdrop-blur-xl transition-all duration-1000 ${state === "syncing" ? "opacity-0" : "opacity-100"}`}
        />

        <div className="relative z-10 flex flex-col items-center justify-center text-slate-800">
          {state === "blooming" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              <div className="text-6xl font-serif font-bold text-slate-900 tracking-tighter">
                2,400
              </div>
              <div className="text-sm tracking-[0.5em] mt-2 text-slate-500 uppercase">
                Light Restored
              </div>
            </motion.div>
          )}
          {state === "syncing" && (
            <motion.div
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <CountingNumber value={targetBalance} duration={2} />
              <div className="text-sm tracking-[0.5em] mt-2 text-slate-500 uppercase">
                Time Synced
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// メインコンテンツの切り替えレイヤー
const MainContent = ({
  viewMode,
  setViewMode,
  isAdmin,
  currentUserId,
  onGoHome,
  ritualState,
  setRitualState,
  setTargetBalance,
  appMode,
  onOpenOnboarding,
}: {
  viewMode: AppViewMode;
  setViewMode: (mode: AppViewMode) => void;
  isAdmin: boolean;
  currentUserId: string;
  onGoHome: () => void;
  ritualState: "idle" | "breathing" | "blooming" | "syncing";
  setRitualState: (
    state: "idle" | "breathing" | "blooming" | "syncing",
  ) => void;
  setTargetBalance: (val: number) => void;
  appMode: AppMode;
  onOpenOnboarding: () => void;
}) => {
  // Normal Mode: Fade in the main content
  const withTransition = (component: React.ReactNode, key: string) => (
    <motion.div
      key={key}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full flex flex-col flex-1"
    >
      {component}
    </motion.div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case "home":
        return withTransition(
          <HomeView
            onOpenFlow={() => setViewMode("flow")}
            onOpenRequest={() => setViewMode("give")}
            ritualState={ritualState}
            setRitualState={setRitualState}
            setTargetBalance={setTargetBalance}
            appMode={appMode}
          />,
          "home",
        );
      case "profile":
        return withTransition(
          <ProfileView
            onTabChange={setViewMode}
            onOpenOnboarding={onOpenOnboarding}
          />,
          "profile",
        );
      case "profile_edit":
        return withTransition(
          <ProfileView
            initialEditMode={true}
            onTabChange={setViewMode}
            onOpenOnboarding={onOpenOnboarding}
          />,
          "profile_edit",
        );
      case "history":
        return withTransition(
          <JournalView
            onTabChange={setViewMode}
            onOpenOnboarding={onOpenOnboarding}
          />,
          "history",
        );
      case "flow":
        return withTransition(
          <FlowView
            currentUserId={currentUserId}
            onOpenProfile={() => setViewMode("profile_edit")}
            onTabChange={setViewMode}
            onOpenOnboarding={onOpenOnboarding}
          />,
          "flow",
        );
      case "give":
        return withTransition(
          <RadianceView
            currentUserId={currentUserId}
            onTabChange={setViewMode}
            onOpenOnboarding={onOpenOnboarding}
          />,
          "give",
        );
      case "admin":
        if (!isAdmin)
          return withTransition(
            <HomeView
              onOpenFlow={() => setViewMode("flow")}
              onOpenRequest={() => setViewMode("give")}
              ritualState={ritualState}
              setRitualState={setRitualState}
              setTargetBalance={setTargetBalance}
              appMode={appMode}
            />,
            "home",
          );
        return withTransition(<AdminDashboard onClose={onGoHome} />, "admin");
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full min-h-full">
      <motion.div
        className="flex-1 w-full relative flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </motion.div>
    </div>
  );
};

const AdminDashboard = lazy(() =>
  import("./components/AdminDashboard").then((module) => ({
    default: module.AdminDashboard as React.ComponentType<{
      onClose: () => void;
    }>,
  })),
);

// Import components
import { GuideModal } from "./components/GuideModal";

// ローダー（白磁の美学）
const ScreenLoader = ({ message }: { message?: string }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F9F8F4] min-h-screen relative overflow-hidden">
    {/* Washi Texture Overlay */}
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
    {/* Ambient Blooms */}
    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-100/10 blur-[120px] rounded-full pointer-events-none" />
    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/10 blur-[120px] rounded-full pointer-events-none" />

    <div className="relative flex flex-col items-center justify-center z-10">
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute w-12 h-12 bg-slate-200 rounded-full animate-ping opacity-20"></div>
        <div className="w-3 h-3 bg-white border border-slate-100 rounded-full shadow-sm animate-pulse z-10"></div>
      </div>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-slate-400 font-serif tracking-[0.2em] text-sm animate-pulse"
        >
          {message}
        </motion.div>
      )}
    </div>
  </div>
);

function App() {
  // THE MACHINE (Single Source of Truth)
  const { view, appMode, data } = useStartupMachine();

  // Need performRebirthReset for the Blessing Trigger
  const { performRebirthReset } = useWallet();

  // Lifted Ritual State to control Global UI (Header/Background)
  const [ritualState, setRitualState] = useState<
    "idle" | "breathing" | "blooming" | "syncing"
  >("idle");
  const [targetBalance, setTargetBalance] = useState(2400); // Lifted for Overlay

  const [viewMode, setViewMode] = useState<AppViewMode>("home");
  const [showAdmin, setShowAdmin] = useState(false);

  // Onboarding / Guide State
  const [showStoryGuide, setShowStoryGuide] = useState(false); // Mission 15: 5-Slide Story (via Sprout)
  const [guideMode, setGuideMode] = useState<"onboarding" | "reference">(
    "reference",
  );
  const [showLegacyGuide, setShowLegacyGuide] = useState(false); // Legacy Text Guide

  // Auto-show Story Guide on first visit
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("has_seen_story_guide_v1");
    if (!hasSeenGuide && viewMode === "home" && view === "APP") {
      setTimeout(() => {
        setGuideMode("onboarding");
        setShowStoryGuide(true);
        localStorage.setItem("has_seen_story_guide_v1", "true");
      }, 1000);
    }
  }, [viewMode, view]);

  const handleOpenOnboarding = () => {
    setGuideMode("reference");
    setShowStoryGuide(true);
  };

  // Sound Effect: 528Hz Crystal Tone
  const playCrystalSound = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(528, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 4.5);
    } catch (e) {
      console.error("Audio Playback Failed", e);
    }
  };

  // Handle Blessing / Onboarding Complete
  const handleOnboardingComplete = async () => {
    setShowStoryGuide(false);

    // Play Blessing Animation
    setRitualState("breathing");
    playCrystalSound();
    await new Promise((r) => setTimeout(r, 1500));

    setRitualState("blooming");

    try {
      const result = await performRebirthReset({ userInitiated: false });
      if (result.success && result.newBalance !== undefined) {
        setTargetBalance(result.newBalance);
      }
    } catch (e) {
      console.error("Blessing failed:", e);
    }

    await new Promise((r) => setTimeout(r, 1500));

    setRitualState("syncing");
    await new Promise((r) => setTimeout(r, 2000));

    setRitualState("idle");
  };

  const handleTabChange = (tab: AppViewMode) => setViewMode(tab);
  const handleGoHome = () => setViewMode("home");

  // Fix: Ensure viewMode resets to home if user loses admin privileges while in admin view
  useEffect(() => {
    if (viewMode === "admin" && !data.isAdmin) {
      setViewMode("home");
    }
  }, [viewMode, data.isAdmin]);

  // --- THE DETERMINISTIC SWITCH ---
  switch (view) {
    case "LOADING":
      return <ScreenLoader message={data.message} />;

    case "GATE":
      return (
        <ErrorBoundary>
          <AuthScreen onSuccess={() => setViewMode("home")} />
        </ErrorBoundary>
      );

    case "APP": {
      const isRitual = appMode === "RITUAL";
      return (
        <div className="bg-white h-screen font-sans selection:bg-orange-100/30 overflow-hidden flex flex-col relative text-[#2D2D2D]">
          {/* Washi Texture Overlay for App */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          {/* Ambient Blooms */}
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-100/10 blur-[120px] rounded-full pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/10 blur-[120px] rounded-full pointer-events-none z-0" />

          {/* Header */}
          <AnimatePresence>
            {viewMode === "home" && !isRitual && ritualState === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute top-0 left-0 right-0 z-50"
              >
                <Header
                  viewMode={viewMode}
                  onTabChange={handleTabChange}
                  onOpenOnboarding={handleOpenOnboarding}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <main
            className={`flex-1 relative overflow-y-auto no-scrollbar scroll-smooth flex flex-col`}
          >
            <Suspense fallback={<ScreenLoader />}>
              <motion.div
                className="w-full h-full flex flex-col flex-1"
                animate={{ opacity: 1 }}
              >
                <MainContent
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  isAdmin={data.isAdmin}
                  currentUserId={data.user!.uid}
                  onGoHome={handleGoHome}
                  ritualState={ritualState}
                  setRitualState={setRitualState}
                  setTargetBalance={setTargetBalance}
                  appMode={appMode}
                  onOpenOnboarding={handleOpenOnboarding}
                />
              </motion.div>
            </Suspense>
          </main>

          {/* Ritual Animation Overlay */}
          <RitualOverlay state={ritualState} targetBalance={targetBalance} />

          {/* Global Onboarding Story */}
          <OnboardingStory
            isOpen={showStoryGuide}
            mode={guideMode}
            onClose={() => setShowStoryGuide(false)}
            onComplete={handleOnboardingComplete}
          />

          {/* Legacy Guide Modal */}
          <AnimatePresence>
            {showLegacyGuide && (
              <GuideModal
                isOpen={showLegacyGuide}
                onClose={() => setShowLegacyGuide(false)}
              />
            )}
          </AnimatePresence>

          {showAdmin && (
            <Suspense fallback={null}>
              <AdminDashboard onClose={() => setShowAdmin(false)} />
            </Suspense>
          )}
        </div>
      );
    }
  }
}
export default App;
