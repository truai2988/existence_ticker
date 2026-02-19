import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuthHook';
import { db } from '../lib/firebase';
import { NameResolver } from './NameResolver';
import { collection, query, where, limit, getDocs, Timestamp } from 'firebase/firestore';
import { HeaderNavigation } from './HeaderNavigation';
import { AppViewMode } from '../types';
import { Sun, Heart, Sparkles, CheckCircle2, Archive } from 'lucide-react';

// ... (comments omitted)

type TransactionLog = {
  id: string;
  owner_id?: string;
  type: string; // 'GIFT', 'WISH_FULFILLMENT', 'REBIRTH'
  amount: number;
  created_at: Timestamp | { seconds: number, nanoseconds: number } | Date | number | string;
  
  sender_id?: string;
  sender_name?: string;
  recipient_id?: string;
  recipient_name?: string;
  wish_title?: string;
  wish_id?: string;
  description?: string;
};

interface JournalViewProps {
  onTabChange?: (mode: AppViewMode) => void;
  onOpenOnboarding: () => void;
}

const parseDate = (val: TransactionLog['created_at']): Date => {
    if (!val) return new Date();
    if (val instanceof Date) return val;
    if (typeof val === 'number') return new Date(val);
    if (typeof val === 'string') return new Date(val);
    if ('toDate' in val && typeof val.toDate === 'function') return val.toDate();
    if ('seconds' in val) return new Date(val.seconds * 1000);
    return new Date();
};

const formatDate = (date: Date): string => {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

    if (isToday) return '今日';
    if (isYesterday) return '昨日';
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const JournalView: React.FC<JournalViewProps> = ({ onTabChange, onOpenOnboarding }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
     const fetchLogs = async () => {
       if (!user || !db) return;
       setIsLoading(true);
       
       const txRef = collection(db, 'transactions');
       const queries = [
           query(txRef, where('owner_id', '==', user.uid), limit(100)),
           query(txRef, where('sender_id', '==', user.uid), limit(100)),
           query(txRef, where('recipient_id', '==', user.uid), limit(100))
       ];

       const results = await Promise.allSettled(queries.map(q => getDocs(q)));
       
       let allDocs: TransactionLog[] = [];
       results.forEach((res, i) => {
           if (res.status === 'fulfilled') {
               const branchDocs = res.value.docs
                   .map(d => ({ id: d.id, ...d.data() } as TransactionLog))
                   .filter(log => log.owner_id !== "__MIGRATED__"); // Skip marked legacy originals
               allDocs = [...allDocs, ...branchDocs];
           } else {
               // Log but don't crash if index is missing for one branch
               console.warn(`[Journal] Query branch ${i} failed:`, res.reason);
           }
       });

       // 1. Unique and Sort
       const uniqueById = Array.from(new Map(allDocs.map(item => [item.id, item])).values());
       const sorted = uniqueById.sort((a, b) => {
           const tA = parseDate(a.created_at).getTime();
           const tB = parseDate(b.created_at).getTime();
           return tB - tA;
       });

       // 2. Logic-based deduplication
       const cleanLogs: TransactionLog[] = [];
       sorted.forEach((current, i) => {
           if (i === 0) { cleanLogs.push(current); return; }
           const prev = cleanLogs[cleanLogs.length - 1];
           const tCurrent = parseDate(current.created_at).getTime();
           const tPrev = parseDate(prev.created_at).getTime();
           const isTimeClose = Math.abs(tPrev - tCurrent) < 2 * 60 * 1000;
           const isSameType = current.type === prev.type;
           const isSameTitle = current.wish_title === prev.wish_title;
           const isSameAmount = current.amount === prev.amount;
           if (isTimeClose && isSameType && isSameTitle && isSameAmount) return;
           cleanLogs.push(current);
       });
       
       setLogs(cleanLogs.slice(0, 100)); // Final limit
       setIsLoading(false);
     };

     fetchLogs();
   }, [user]);

  return (
    <div className="flex-1 flex flex-col w-full h-full relative">
        <div className="border-b border-slate-100/50 pt-safe">
            <div className="max-w-2xl mx-auto px-6 py-4 md:py-6 flex items-start justify-between">
                 <div className="min-w-0">
                    <div className="text-xs font-light tracking-[0.4em] uppercase text-slate-300 leading-none mb-3 select-none">
                        Existence Ticker
                    </div>
                    <h2 className="text-xl font-bold tracking-widest uppercase text-slate-900">巡りの足跡</h2>
                    <p className="text-xs text-slate-500 font-mono tracking-[0.2em] uppercase mt-1 truncate">あなたの歩みの記録</p>
                </div>
                {onTabChange && (
                    <div className="flex h-12 items-end gap-2 shrink-0">
                        <HeaderNavigation 
                            currentTab="history" 
                            onTabChange={(tab: AppViewMode) => onTabChange(tab)} 
                            onOpenOnboarding={onOpenOnboarding} 
                        />
                    </div>
                )}
            </div>
        </div>

        <div className="w-full flex-grow overflow-y-auto no-scrollbar relative flex flex-col items-center">
             <div className="w-full max-w-2xl flex-grow p-6 pt-4 pb-24 relative">
                <div className="absolute left-[27px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-slate-300/50 to-transparent"></div>
                <div className="space-y-8 py-4 pl-4">
                    {isLoading ? (
                         <div className="text-center py-10 text-slate-600 text-xs animate-pulse">読み込み中...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-20 px-4">
                            <p className="text-sm text-slate-600 font-medium mb-2">白紙の物語</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                これから、あなたの歩む道がここに刻まれます。<br/>
                                誰かと光を分かち合ったその瞬間が、<br/>
                                美しい足跡となって残るでしょう。
                            </p>
                        </div>
                    ) : (
                        logs.map((log, index) => (
                           <LogItem key={log.id} log={log} index={index} userId={user?.uid || ''} />
                        ))
                    )}
                </div>
             </div>
        </div>
    </div>
  );
};

const LogItem = ({ log, index, userId }: { log: TransactionLog, index: number, userId: string }) => {
    const isSender = log.sender_id === userId;
    const date = parseDate(log.created_at);
    const dateStr = formatDate(date);
    
    // --- 世界の理: 単一ソース・スナップショットのみを正義とする ---
    const partnerId = isSender ? log.recipient_id : log.sender_id;
    const partnerName = (
        <span className="font-bold">
            <NameResolver 
                userId={partnerId || null} 
                initialName={(isSender ? log.recipient_name : log.sender_name) || null} 
            />
        </span>
    );

    const isExp = isSender && !['REBIRTH', 'BIRTH'].includes(log.type); 
    let amountColor = isExp ? "text-rose-500" : "text-emerald-500";
    if (log.amount === 0) amountColor = "text-slate-300";

    return (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-start gap-3 relative group transition-all rounded-xl p-2 -ml-2">
            <div className="w-12 pt-1 text-right shrink-0">
                <span className="text-xs font-mono text-slate-400 block">{dateStr}</span>
                <span className="text-xs font-mono text-slate-300 block">{date.getHours().toString().padStart(2, '0')}:{date.getMinutes().toString().padStart(2, '0')}</span>
            </div>
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 z-10 box-content bg-white ${isExp ? 'border-rose-100 shadow-sm' : 'border-emerald-100 shadow-sm'}`}>
                {(() => {
                    const t = log.type;
                    if (t === 'REBIRTH' || t === 'BIRTH') return <Sun size={14} className="text-amber-500 fill-amber-100" />;
                    if (t === 'GIFT') return isSender ? <Heart size={14} className="text-pink-500" /> : <Sparkles size={14} className="text-cyan-500" />;
                    if (t === 'WISH_CANCELLED' || t === 'WISH_EXPIRED') return <Archive size={14} className="text-slate-400" />;
                    if (t === 'COMPENSATION') return isSender ? <CheckCircle2 size={14} className="text-rose-400" /> : <Sun size={14} className="text-amber-500" />;
                    return <CheckCircle2 size={14} className={isExp ? "text-rose-500" : "text-emerald-500"} />;
                })()}
            </div>
            <div className="flex-1 pb-6 border-b border-slate-100 last:border-0">
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    {(() => {
                        const t = log.type;
                        if (t === 'BIRTH') return "新規登録しました";
                        if (t === 'REBIRTH') return "太陽の光で器が満たされました（リセット）";
                        if (t === 'GIFT') return isSender ? <>{partnerName}さんに光を贈りました</> : <>{partnerName}さんから光を預かりました</>;
                        if (t === 'WISH_CANCELLED') return log.wish_title ? `「${log.wish_title}」を取り下げました` : "願いを取り下げました";
                        if (t === 'WISH_EXPIRED') return log.wish_title ? `「${log.wish_title}」が期限切れになりました` : "願いが期限切れになりました";
                        if (t === 'COMPENSATION') {
                            const isWithdrawal = log.description?.includes('退会');
                            if (isSender) return isWithdrawal ? <>{partnerName}（退会）への感謝を刻みました</> : <>{partnerName}さんにお詫びのしるしを渡しました</>;
                            return isWithdrawal ? <>{partnerName}さんの退会に伴う感謝を受け取りました</> : <>{partnerName}さんからお詫びのしるしを受け取りました</>;
                        }
                        return isSender ? <>{partnerName}さんに感謝を伝えました</> : <>{partnerName}さんの願いを叶えました</>;
                    })()}
                </p>
                {log.wish_title && log.type !== 'WISH_CANCELLED' && log.type !== 'WISH_EXPIRED' && (
                    <p className="text-xs text-slate-400 mt-1 pl-2 border-l-2 border-slate-100 line-clamp-1 italic">"{log.wish_title}"</p>
                )}
                {log.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {(() => {
                            const d = log.description;
                            const isComp = log.type === 'COMPENSATION';
                            
                            // Legacy mapping for Compensation (The specific case in the user's image)
                            if (isComp) {
                                if (d.includes('誠実のしるしをお渡ししました') || d.includes('しるしが発生しました')) {
                                    return isSender ? "中断に伴い、誠実のしるしをお渡ししました" : "依頼主の中断に伴い、誠実のしるしが届きました";
                                }
                            }

                            // Cleanup legacy tags for Fulfillment
                            if (d === "wish_fulfilled [Crystallized]") return isSender ? "願いを叶えてくれた感謝を、源気（Lm）に込めて贈りました" : "感謝が結晶（Lm）になって届きました";
                            if (d === "wish_fulfilled (Bankruptcy Partial Payment) [Crystallized]") return isSender ? "感謝を贈りましたが、余力が足りず一部のみが結晶になりました" : "感謝が届きましたが、余力が足りず一部のみが結晶になりました";
                            
                            if (d === "system_expiration") return "期限を過ぎたため、自動的に整理されました";
                            if (d === "user_cancellation") return "願いを取り下げました";
                            if (d === "想いが巡りました（Priceless）") return d;
                            if (d === "命が宿りました") return "源気が流れ込んできました";
                            return d;
                        })()}
                    </p>
                )}
                <div className="mt-2 flex items-center justify-end gap-1">
                    {log.amount === 0 ? (
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest pl-2">
                           {log.type === 'WISH_EXPIRED' ? '期限切れ' : '記録済み'}
                        </span>
                    ) : (
                        <><span className={`text-sm font-mono font-bold ${amountColor}`}>{!isExp ? '+' : '-'}{Math.floor(Math.abs(log.amount)).toLocaleString()}</span><span className="text-xs text-slate-400 ml-1">Lm</span></>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
