import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuthHook';
import { db } from '../lib/firebase';
import { NameResolver } from './NameResolver';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { AppViewMode } from '../types';
import { SideDrawer } from './SideDrawer';
import { useLanguage } from '../contexts/LanguageContext';
import { Sun, Heart, Sparkles, CheckCircle2, Archive, Menu } from 'lucide-react';

import { TransactionRecord } from '../types/transaction';

interface JournalViewProps {
  onTabChange?: (mode: AppViewMode) => void;
  onOpenOnboarding: () => void;
}

const parseDate = (val: TransactionRecord['created_at']): Date => {
    if (!val) return new Date();
    if (val instanceof Date) return val;
    if (typeof val === 'number') return new Date(val);
    if (typeof val === 'string') return new Date(val);
    if ('toDate' in val && typeof val.toDate === 'function') return val.toDate();
    if ('seconds' in val) return new Date(val.seconds * 1000);
    return new Date();
};

export const JournalView: React.FC<JournalViewProps> = ({ onTabChange, onOpenOnboarding }) => {
  const { user } = useAuth();
  const { t: MESSAGES } = useLanguage();
  const [logs, setLogs] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const formatDate = (date: Date): string => {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

    if (isToday) return MESSAGES.JOURNAL.TODAY;
    if (isYesterday) return MESSAGES.JOURNAL.YESTERDAY;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

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
       
       let allDocs: TransactionRecord[] = [];
       results.forEach((res, i) => {
           if (res.status === 'fulfilled') {
               const branchDocs = res.value.docs
                   .map(d => ({ id: d.id, ...d.data() } as TransactionRecord))
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
       const cleanLogs: TransactionRecord[] = [];
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
        <div className="pt-safe w-full">
            <div className="w-full max-w-2xl mx-auto px-6 py-4 md:py-6 flex items-center justify-between">
                 <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => onTabChange?.('home')}
                        aria-label={MESSAGES.LAYOUT.RETURN_HOME}
                        className="shrink-0 focus:outline-none active:scale-95 transition-transform"
                    >
                        <img
                            src="/logo.png"
                            alt="Existence Ticker"
                            className="w-10 h-10 rounded-lg shadow-sm border border-slate-300/50 object-cover hover:opacity-80 transition-opacity"
                        />
                    </button>
                    <div className="flex flex-col min-w-0 justify-center">
                        <h2 className="text-xl font-serif font-medium text-slate-900 truncate leading-tight uppercase" style={{fontFamily: "'Noto Serif JP', serif"}}>{MESSAGES.JOURNAL.TITLE}</h2>
                    </div>
                </div>
                <div className="flex h-12 items-center gap-3 shrink-0">
                    <button
                      onClick={() => setIsDrawerOpen(true)}
                      className="p-3 -mr-3 text-slate-700 hover:text-slate-900 transition-colors active:scale-95"
                      aria-label={MESSAGES.LAYOUT.OPEN_MENU}
                    >
                      <Menu size={24} strokeWidth={1.5} />
                    </button>
                </div>
            </div>
        </div>

        <SideDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          currentTab="history"
          onTabChange={(tab: AppViewMode) => onTabChange?.(tab)}
          onOpenOnboarding={onOpenOnboarding}
        />

        <div className="w-full flex-grow overflow-y-auto no-scrollbar relative flex flex-col items-center">
             <div className="w-full max-w-2xl flex-grow p-6 pt-4 pb-24 relative">
                <div className="space-y-3 py-4">
                    {isLoading ? (
                         <div className="text-center py-10 text-slate-800 text-sm animate-pulse">{MESSAGES.JOURNAL.LOADING}</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-20 px-4">
                            <p className="text-sm text-slate-800 font-medium mb-2">{MESSAGES.JOURNAL.EMPTY_TITLE}</p>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {MESSAGES.JOURNAL.EMPTY_DESC_1}<br/>
                                {MESSAGES.JOURNAL.EMPTY_DESC_2}<br/>
                                {MESSAGES.JOURNAL.EMPTY_DESC_3}
                            </p>
                        </div>
                    ) : (
                        logs.map((log, index) => (
                           <LogItem 
                             key={log.id} 
                             log={log} 
                             index={index} 
                             userId={user?.uid || ''} 
                             MESSAGES={MESSAGES}
                             formatDate={formatDate}
                           />
                        ))
                    )}
                </div>
             </div>
        </div>
    </div>
  );
};

const LogItem = ({ log, index, userId, MESSAGES, formatDate }: { log: TransactionRecord, index: number, userId: string, MESSAGES: typeof import('../constants/messages').MESSAGES, formatDate: (d: Date) => string }) => {
    const isSender = log.sender_id === userId;
    const date = parseDate(log.created_at);
    const dateStr = formatDate(date);
    
    const partnerId = isSender ? log.recipient_id : log.sender_id;
    const partnerName = (
        <span className="font-bold">
            <NameResolver 
                userId={partnerId || null} 
                initialName={(isSender ? log.recipient_name : log.sender_name) || null} 
            />
        </span>
    );

    const isGrant = ['REBIRTH', 'BIRTH'].includes(log.type);
    const isExp = isSender && !isGrant; 
    let amountColor = isExp ? "text-rose-500" : "text-emerald-500";
    if (log.amount === 0) amountColor = "text-slate-700";

    const getIcon = () => {
      const t = log.type;
      if (t === 'REBIRTH' || t === 'BIRTH') return <Sun size={14} className="text-amber-500 fill-amber-100" />;
      if (t === 'GIFT') return isSender ? <Heart size={14} className="text-pink-500" /> : <Sparkles size={14} className="text-cyan-500" />;
      if (t === 'WISH_CANCELLED' || t === 'WISH_EXPIRED') return <Archive size={14} className="text-slate-700" />;
      if (t === 'COMPENSATION') return isSender ? <CheckCircle2 size={14} className="text-rose-400" /> : <Sun size={14} className="text-amber-500" />;
      return <CheckCircle2 size={14} className={isExp ? "text-rose-500" : "text-emerald-500"} />;
    };

    const getTitle = () => {
      const t = log.type;
      if (t === 'BIRTH') return MESSAGES.JOURNAL.LOG_BIRTH;
      if (t === 'REBIRTH') return MESSAGES.JOURNAL.LOG_REBIRTH;
      if (t === 'GIFT') return isSender ? <>{partnerName}{MESSAGES.JOURNAL.LOG_GIFT_SENT}</> : <>{partnerName}{MESSAGES.JOURNAL.LOG_GIFT_RECV}</>;
      if (t === 'WISH_CANCELLED') return log.wish_title ? MESSAGES.JOURNAL.LOG_WISH_CANCEL_TITLE.replace('%s', log.wish_title) : MESSAGES.JOURNAL.LOG_WISH_CANCEL;
      if (t === 'WISH_EXPIRED') return log.wish_title ? MESSAGES.JOURNAL.LOG_WISH_EXPIRE_TITLE.replace('%s', log.wish_title) : MESSAGES.JOURNAL.LOG_WISH_EXPIRE;
      if (t === 'COMPENSATION') {
          const isWithdrawal = log.description === "compensation_sender" || log.description === "compensation_recv" || log.description?.includes(MESSAGES.JOURNAL.KW_WITHDRAWAL);
          if (isSender) return isWithdrawal ? <>{partnerName}{MESSAGES.JOURNAL.LOG_COMP_SENDER_WITHDRAW}</> : <>{partnerName}{MESSAGES.JOURNAL.LOG_COMP_SENDER_NORMAL}</>;
          return isWithdrawal ? <>{partnerName}{MESSAGES.JOURNAL.LOG_COMP_RECV_WITHDRAW}</> : <>{partnerName}{MESSAGES.JOURNAL.LOG_COMP_RECV_NORMAL}</>;
      }
      return isSender ? <>{partnerName}{MESSAGES.JOURNAL.LOG_WISH_SENDER}</> : <>{partnerName}{MESSAGES.JOURNAL.LOG_WISH_RECV}</>;
    };

    const getDescription = () => {
      const d = log.description;
      if (!d) return null;
      
      const isComp = log.type === 'COMPENSATION';
      
      // 1. Direct Literal Match (Optimized)
      const directMap: Record<string, string> = {
        "wish_fulfill_sender": MESSAGES.JOURNAL.DESC_WISH_SENDER,
        "wish_fulfill_recv": MESSAGES.JOURNAL.DESC_WISH_RECV,
        "wish_priceless": MESSAGES.JOURNAL.DESC_PRICELESS,
        "wish_bankrupt_sender": MESSAGES.JOURNAL.DESC_WISH_PARTIAL_SENDER,
        "wish_bankrupt_recv": MESSAGES.JOURNAL.DESC_WISH_PARTIAL_RECV,
        "compensation_sender": MESSAGES.JOURNAL.DESC_COMP_SENDER,
        "compensation_recv": MESSAGES.JOURNAL.DESC_COMP_RECV,
        "user_cancellation": MESSAGES.JOURNAL.LOG_WISH_CANCEL,
        "system_expiration": MESSAGES.JOURNAL.DESC_EXPIRED,
        "system_birth": MESSAGES.JOURNAL.DESC_BIRTH,
        "system_rebirth": MESSAGES.JOURNAL.DESC_REBIRTH,
      };
      if (directMap[d]) return directMap[d];

      // 2. Legacy / Fuzzy Matching fallback
      if (isComp) {
          if (d.includes(MESSAGES.JOURNAL.KW_COMPENSATION_SENDER) || d.includes(MESSAGES.JOURNAL.KW_COMPENSATION_MAKER)) {
              return isSender ? MESSAGES.JOURNAL.DESC_COMP_SENDER : MESSAGES.JOURNAL.DESC_COMP_RECV;
          }
          if (d === "中断に伴い、誠実のしるしをお渡ししました") return MESSAGES.JOURNAL.DESC_COMP_SENDER;
          if (d === "依頼主の中断に伴い、誠実のしるしが届きました") return MESSAGES.JOURNAL.DESC_COMP_RECV;
      }

      if (d === "wish_fulfilled [Crystallized]") return isSender ? MESSAGES.JOURNAL.DESC_WISH_SENDER : MESSAGES.JOURNAL.DESC_WISH_RECV;
      if (d === "wish_fulfilled (Bankruptcy Partial Payment) [Crystallized]") return isSender ? MESSAGES.JOURNAL.DESC_WISH_PARTIAL_SENDER : MESSAGES.JOURNAL.DESC_WISH_PARTIAL_RECV;
      if (d === "願いを叶えてくれた感謝を、Lmに込めて贈りました") return MESSAGES.JOURNAL.DESC_WISH_SENDER;
      if (d === "感謝がLmになって届きました") return MESSAGES.JOURNAL.DESC_WISH_RECV;
      if (d === "想いが巡りました（Priceless）") return MESSAGES.JOURNAL.DESC_PRICELESS;
      if (d === "感謝を贈りましたが、余力が足りず一部のみが結晶になりました") return MESSAGES.JOURNAL.DESC_WISH_PARTIAL_SENDER;
      if (d === "感謝が届きましたが、余力が足りず一部のみが結晶になりました") return MESSAGES.JOURNAL.DESC_WISH_PARTIAL_RECV;
      
      if ([MESSAGES.JOURNAL.KW_BIRTH, MESSAGES.JOURNAL.DB_DESC_BIRTH, "Lmが流れ込んできました", "命が宿りました", "誕生"].includes(d)) return MESSAGES.JOURNAL.DESC_BIRTH;
      if ([MESSAGES.JOURNAL.KW_REBIRTH, MESSAGES.JOURNAL.DB_DESC_REBIRTH, "魂が再生されました", "再生"].includes(d)) return MESSAGES.JOURNAL.DESC_REBIRTH;
      if (d === MESSAGES.JOURNAL.KW_BIRTH_ORIGINAL) return MESSAGES.JOURNAL.DESC_BIRTH;
      if (d === MESSAGES.JOURNAL.KW_PRICELESS || d === "無償の願い") return MESSAGES.JOURNAL.DESC_PRICELESS;
      if (d === "願いを取り下げました") return MESSAGES.JOURNAL.LOG_WISH_CANCEL;
      if (["期限を過ぎたため、自動的に整理されました", "期限が経過したため、自動的に取り下げられました"].includes(d)) return MESSAGES.JOURNAL.DESC_EXPIRED;

      return d;
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: index * 0.05 }} 
            className="flex flex-col gap-4 relative group transition-shadow rounded-[2rem] p-5 bg-white shadow-sm border border-slate-200 shadow-sm hover:shadow-md"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isExp ? 'bg-rose-50/80' : 'bg-emerald-50/80'}`}>
                        {getIcon()}
                    </div>
                    <span className="text-xs font-serif tracking-widest text-slate-700 uppercase">{dateStr} — {date.getHours().toString().padStart(2, '0')}:{date.getMinutes().toString().padStart(2, '0')}</span>
                </div>
                <div className="flex items-center gap-1 opacity-80">
                    <span className={`text-base font-mono font-light ${amountColor}`}>
                        {Math.floor(Math.abs(log.amount)) === 0 
                            ? '±0' 
                            : `${(!isSender || isGrant) ? '+' : '-'}${Math.floor(Math.abs(log.amount)).toLocaleString()}`
                        }
                    </span>
                    <span className="text-xs text-slate-700 font-sans tracking-tight">Lm</span>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-base text-slate-900 font-serif font-medium leading-relaxed tracking-wide">
                    {getTitle()}
                </p>
                {log.wish_title && log.type !== 'WISH_CANCELLED' && log.type !== 'WISH_EXPIRED' && (
                    <p className="text-sm text-slate-700 mt-2 pl-3 border-l border-slate-300/50 italic line-clamp-1">"{log.wish_title}"</p>
                )}
                <p className="text-sm text-slate-700 mt-2 line-clamp-2 leading-relaxed font-light">
                    {getDescription()}
                </p>
            </div>
        </motion.div>
    );
};
