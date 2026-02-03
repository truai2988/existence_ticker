import React from "react";
import { motion } from "framer-motion";
import { Inbox, Megaphone } from "lucide-react";

interface HomeViewProps {
  onOpenFlow: () => void; // "Help" (Inflow)
  onOpenRequest: () => void; // "Request" (Outflow)
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenFlow,
  onOpenRequest,
}) => {



  // Pure CSS Animation for "Breathing" to offload JS thread
  // Added directly into style block for zero overhead
  const loadingStyle = `
    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
  `;

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-full p-4 relative max-w-md mx-auto overflow-hidden">
      <style>{loadingStyle}</style>

      {/* 2. CORE VESSEL: YIN-YANG INTERFACE */}
      <div className="flex-1 flex items-center justify-center w-full relative">
        {/* Simplified Background Aura - Pure CSS Opacity */}
        <div className="absolute inset-0 bg-slate-100/50 rounded-full blur-2xl opacity-30 z-0 pointer-events-none" />

        {/* CONTAINER: 288px (w-72) */}
        <div className="relative w-72 h-72 z-10">
          {/* A. BACKGROUND LAYER (The Breathing Shape - Pure CSS) */}
          <div
            className="absolute inset-0 rounded-full shadow-2xl shadow-slate-200/50 border-4 border-white overflow-hidden bg-white"
            style={{ animation: "breathe 8s ease-in-out infinite" }}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full shape-rendering-geometricPrecision"
            >
              <defs>
                {/* 境界線等のフィルタ */}
                <filter id="dividerGlow">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                {/* グラデーション定義 */}
                {/* Yang (Blue): Top Area */}
                <linearGradient id="yangGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#BFDBFE" /> {/* blue-200 */}
                  <stop offset="100%" stopColor="#DBEAFE" /> {/* blue-100 */}
                </linearGradient>
                
                {/* Yin (Yellow): Bottom Area */}
                <linearGradient id="yinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FEF3C7" /> {/* amber-100 */}
                  <stop offset="100%" stopColor="#FDE68A" /> {/* amber-200 */}
                </linearGradient>
              </defs>

              {/* GROUP ROTATION: -45 degrees (Counter-Clockwise) */}
              {/* Rotates horizontal layout (Left=Start, Right=End) to Diagonal (Left-Bottom to Right-Top) */}
              {/* Creates a POSITIVE slope (/) */}
              <g transform="rotate(-45 50 50)">
                  
                  {/* YIN (Yellow) - Bottom Half */}
                  {/* Path: Outer circle bottom half + S-curve boundary (Left=Valley, Right=Mountain) */}
                  <path
                     d="M 0 50 A 25 25 0 0 0 50 50 A 25 25 0 0 1 100 50 A 50 50 0 0 1 0 50 Z"
                     fill="url(#yinGradient)"
                     stroke="none"
                  />

                  {/* YANG (Blue) - Top Half */}
                  {/* Path: Outer circle top half + S-curve boundary (Left=Valley, Right=Mountain) */}
                  <path
                     d="M 0 50 A 25 25 0 0 0 50 50 A 25 25 0 0 1 100 50 A 50 50 0 0 0 0 50 Z"
                     fill="url(#yangGradient)"
                     stroke="none"
                  />
                  
                  {/* Divider Line (S-curve) */}
                  {/* Left(0,50) -> Valley -> Center -> Mountain -> Right(100,50) */}
                  {/* This ensures "Rising" flow when rotated -45 deg */}
                  <path 
                     d="M 0 50 A 25 25 0 0 0 50 50 A 25 25 0 0 1 100 50"
                     fill="none" 
                     stroke="white" 
                     strokeWidth="2.5"
                     filter="url(#dividerGlow)"
                     opacity="0.9"
                     strokeLinecap="round"
                  />
              </g>
            </svg>
          </div>

          {/* B. INTERACTIVE LAYER (Static Text, Glow Hover) */}

          {/* Right-Top Content (Yang) - 手伝う / HELP */}
          {/* Right-Top Content (Yang) - 手伝う / HELP */}
          {/* Right-Top Content (Yang) - 手伝う / HELP */}
          <motion.button
            onClick={onOpenFlow}
            className="absolute top-[22%] right-[22%] flex flex-col items-end z-20 outline-none group"
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            <motion.div
              className="text-blue-700 flex flex-col items-end group-hover:text-blue-600"
              variants={{
                initial: { y: 0, scale: 1 },
                hover: {
                  y: -5,
                  scale: 1.03,
                  transition: { type: "spring", stiffness: 300, damping: 20 },
                },
                tap: { scale: 0.98 },
              }}
            >
              <Inbox size={32} strokeWidth={2.5} className="mb-1" />
              <span className="text-xs font-extrabold tracking-[0.2em] opacity-90">
                HELP
              </span>
              <span className="text-xl font-extrabold">手伝う</span>
            </motion.div>
          </motion.button>

          {/* Left-Bottom Content (Yin) - 頼む / WISH */}
          <motion.button
            onClick={onOpenRequest}
            className="absolute bottom-[22%] left-[22%] flex flex-col items-start z-20 outline-none group"
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            <motion.div
              className="text-amber-800 flex flex-col items-start group-hover:text-amber-700"
              variants={{
                initial: { y: 0, scale: 1 },
                hover: {
                  y: -5,
                  scale: 1.03,
                  transition: { type: "spring", stiffness: 300, damping: 20 },
                },
                tap: { scale: 0.98 },
              }}
            >
              <span className="text-xl font-extrabold">頼む</span>
              <span className="text-xs font-extrabold tracking-[0.2em] opacity-90 mt-0.5">
                WISH
              </span>
              <Megaphone size={28} strokeWidth={2.5} className="mt-1" />
            </motion.div>
          </motion.button>
        </div>
      </div>

      
    </div>
  );
};
