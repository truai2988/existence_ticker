/* eslint-disable react-refresh/only-export-components */
import React, { useState, useCallback, useContext } from 'react';

// 非対応ブラウザでのエラーを防ぐ安全なハプティクス関数
const safeVibrate = (pattern: number | number[]) => {
  if (typeof window !== "undefined" && navigator && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // 非対応環境は静かに無視する
    }
  }
};

type InteractionContextType = {
  triggerAccept: () => void;
  triggerComplete: () => void;
};

const InteractionContext = React.createContext<InteractionContextType>({
  triggerAccept: () => {},
  triggerComplete: () => {},
});

// アプリのルート（または必要な階層）を囲むProvider
export const MicroInteractionProvider = ({ children }: { children: React.ReactNode }) => {
  const [showAcceptEffect, setShowAcceptEffect] = useState(false);
  const [showCompleteEffect, setShowCompleteEffect] = useState(false);

  // 3. 立候補を受けるとき（マッチング成立）
  const triggerAccept = useCallback(() => {
    safeVibrate(40); // 万年筆のキャップを閉めたような小気味よい振動
    setShowAcceptEffect(true);
    setTimeout(() => setShowAcceptEffect(false), 1500);
  }, []);

  // 4. 願いの完了ボタンを押すとき（無償の「ありがとう」の瞬間）
  const triggerComplete = useCallback(() => {
    // 深く息を吸って（前段の短い振動）、ゆっくり吐き出す（500msの長い振動と余韻）
    safeVibrate([50, 50, 50, 50, 50, 500, 10, 10, 10, 10, 10]);
    setShowCompleteEffect(true);
    setTimeout(() => setShowCompleteEffect(false), 3000);
  }, []);

  return (
    <InteractionContext.Provider value={{ triggerAccept, triggerComplete }}>
      {children}
      
      {/* 3. マッチング成立：光の粒子が寄り添い消える */}
      {showAcceptEffect && (
        <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* 左からの粒子 */}
            <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_3px_rgba(255,255,255,0.5)] animate-particle-left" />
            {/* 右からの粒子 */}
            <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_3px_rgba(255,255,255,0.5)] animate-particle-right" />
            {/* 重なって広がる粒子 */}
            <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_12px_4px_rgba(255,255,255,0.6)] opacity-0 animate-particle-merge" />
          </div>
        </div>
      )}

      {/* 4. 願いの完了：温かい夕暮れの深呼吸グラデーション */}
      {showCompleteEffect && (
        <div className="fixed inset-0 pointer-events-none z-[9998] bg-gradient-to-br from-[#FFB04F] to-[#FF8C42] opacity-0 animate-sunset-breath mix-blend-overlay" />
      )}
    </InteractionContext.Provider>
  );
};

// 実際のコンポーネントで呼び出すHook
export const useMicroInteractions = () => {
  const context = useContext(InteractionContext);

  // 1. 願いを送るとき（送信アクション用のPropsジェネレーター）
  const getSendAction = (onClick: () => void | Promise<void>) => {
    return async (e: React.MouseEvent<HTMLButtonElement>) => {
      const btn = e.currentTarget;
      if (btn.disabled || btn.getAttribute('data-animating') === 'true') return;
      btn.setAttribute('data-animating', 'true');

      safeVibrate(20); // 万年筆が離れたような「コッ」
      
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.className = "absolute bg-white/40 rounded-full animate-ripple pointer-events-none z-0";
      
      const textSpan = btn.querySelector('span');
      if (textSpan) textSpan.classList.add('animate-text-vanish');
      
      btn.appendChild(ripple);
      
      // エフェクト終了まで待機してから実行
      await new Promise(r => setTimeout(r, 600));
      
      ripple.remove();
      if (textSpan) textSpan.classList.remove('animate-text-vanish');
      btn.removeAttribute('data-animating');

      await onClick();
    };
  };

  // 2. 立候補するとき（アンバー色へのフラッシュ）
  const getCandidateAction = (onClick: () => void | Promise<void>) => {
    return async (e: React.MouseEvent<HTMLButtonElement>) => {
      const btn = e.currentTarget;
      if (btn.disabled || btn.getAttribute('data-animating') === 'true') return;
      btn.setAttribute('data-animating', 'true');

      safeVibrate([30, 100, 30]); // 心臓の鼓動「…トクリ」
      
      btn.classList.add('animate-amber-flash-container');
      
      // エフェクト終了まで待機してから実行
      await new Promise(r => setTimeout(r, 500));
      
      btn.classList.remove('animate-amber-flash-container');
      btn.removeAttribute('data-animating');

      await onClick();
    };
  };

  return {
    getSendAction,
    getCandidateAction,
    triggerAccept: context.triggerAccept,
    triggerComplete: context.triggerComplete
  };
};
