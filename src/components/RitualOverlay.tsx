export const RitualOverlay = ({ state }: { state: string; targetBalance: number }) => {
  if (state === 'idle') return null;
  return (
    <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center bg-white/10 backdrop-blur-sm">
      <div className="text-slate-400 text-sm tracking-widest animate-pulse">
        {state.toUpperCase()}...
      </div>
    </div>
  );
};
