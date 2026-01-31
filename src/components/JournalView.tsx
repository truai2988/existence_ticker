import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sun, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuthHook';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { UserSubBar } from './UserSubBar';

// Type Definition for our unified Transaction
type TransactionLog = {
  id: string;
  type: string; // 'GIFT', 'WISH_FULFILLMENT', 'REBIRTH'
  amount: number;
  created_at: Timestamp | { seconds: number, nanoseconds: number } | Date | number | string;
  
  // Context
  sender_id?: string;
  sender_name?: string;
  recipient_id?: string;
  recipient_name?: string;
  wish_title?: string;
  description?: string;
};

interface JournalViewProps {
  onClose: () => void;
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

export const JournalView: React.FC<JournalViewProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
     if (!user || !db) return;
     
     const txRef = collection(db, 'transactions');
     
     // 1. Sent
     const qSent = query(txRef, where('sender_id', '==', user.uid), orderBy('created_at', 'desc'), limit(50));
     // 2. Received
     const qReceived = query(txRef, where('recipient_id', '==', user.uid), orderBy('created_at', 'desc'), limit(50));

     // Given the constraint of React useEffect hooks and async logic, let's use a simpler strategy:
     // We will listen to BOTH and merge state.
     
     let sentData: TransactionLog[] = [];
     let receivedData: TransactionLog[] = [];

     const updateState = () => {
         const merged = [...sentData, ...receivedData];
         // Remove duplicates if any (self-send?)
         const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
         const sorted = unique.sort((a, b) => {
             const tA = parseDate(a.created_at).getTime();
             const tB = parseDate(b.created_at).getTime();
             return tB - tA;
         });
         setLogs(sorted);
         setIsLoading(false);
     };

     const u1 = onSnapshot(qSent, 
       (snap) => {
         sentData = snap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionLog));
         updateState();
       },
       (error) => {
         console.error("History sync error (Sent):", error);
         setIsLoading(false);
       }
     );
     
     const u2 = onSnapshot(qReceived, 
       (snap) => {
         receivedData = snap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionLog));
         updateState();
       },
       (error) => {
         console.error("History sync error (Received):", error);
         setIsLoading(false);
       }
     );

     return () => {
         u1();
         u2();
     };
  }, [user]);

  return (
    <div className="fixed inset-0 h-[100dvh] z-[60] flex flex-col items-center bg-slate-50/95 backdrop-blur-md overflow-hidden animate-fade-in w-full">
        {/* Full width header container */}
        <div className="w-full shrink-0 border-b border-slate-200 pt-safe bg-white/80 backdrop-blur-md">
             <div className="max-w-md mx-auto px-6 h-[90px] flex flex-col justify-start pt-3">
                 <div className="flex justify-between items-center w-full">
                     <div>
                        <h2 className="text-2xl font-serif text-slate-900">あなたの記録</h2>
                        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Journal of Light</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <X className="text-slate-400" size={20} />
                    </button>
                 </div>
             </div>
        </div>
        <UserSubBar />

        {/* Content Container */}
        <div className="w-full flex-grow overflow-y-auto no-scrollbar relative flex flex-col items-center">
             <div className="w-full max-w-md flex-grow p-6 pt-4 pb-24 relative">
                {/* Timeline Line */}
                <div className="absolute left-[27px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-slate-300/50 to-transparent"></div>
                
                <div className="space-y-8 py-4 pl-4">
                    {isLoading ? (
                         <div className="text-center py-10 text-slate-400 text-xs animate-pulse">読み込み中...</div>
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

// Sub-component for each log item
const LogItem = ({ log, index, userId }: { log: TransactionLog, index: number, userId: string }) => {
    const isSender = log.sender_id === userId;
    const date = parseDate(log.created_at);
    const dateStr = formatDate(date);
    
    // Use snapshot name (name saved at transaction time)
    const partnerName = (isSender ? log.recipient_name : log.sender_name) || '誰か';

    // Determining Content based on rules
    let icon, title, metaColor, amountPrefix, amountColor;

    if (log.type === 'REBIRTH') {
        // [再生]
        icon = <Sun size={14} className="text-amber-500 fill-amber-100" />;
        title = "太陽の光で器が満たされました（リセット）";
        metaColor = "bg-amber-50 border-amber-200";
        amountPrefix = "+"; // Inflow
        amountColor = "text-amber-600";
    } 
    else if (log.type === 'GIFT') {
        if (isSender) {
            // [ギフト送付]
            icon = <Heart size={14} className="text-pink-500 fill-pink-50" />;
            title = `${partnerName}さんに光を贈りました（ギフト）`;
            metaColor = "bg-pink-50 border-pink-200";
            amountPrefix = ""; // No negative sign requested
            amountColor = "text-slate-400"; // Neutral for "Sharing"
        } else {
            // [ギフト受取]
            icon = <Sparkles size={14} className="text-cyan-500 fill-cyan-50" />;
            title = `${partnerName}さんから光を預かりました（ギフト）`;
            metaColor = "bg-cyan-50 border-cyan-200";
            amountPrefix = "+";
            amountColor = "text-cyan-600";
        }
    } 
    else { // WISH_FULFILLMENT
        if (isSender) {
             // [依頼支払い] (I was the requester, I paid)
             icon = <CheckCircle2 size={14} className="text-amber-600" />;
             title = `${partnerName}さんに感謝を伝えました（依頼完了）`;
             metaColor = "bg-amber-50 border-amber-200";
             amountPrefix = ""; // No negative sign
             amountColor = "text-slate-400";
             
        } else {
             // [報酬受取] (I was the helper, I got paid)
             icon = <CheckCircle2 size={14} className="text-blue-600" />;
             title = `${partnerName}さんの願いを叶えました（報酬受取）`;
             metaColor = "bg-blue-50 border-blue-200";
             amountPrefix = "+";
             amountColor = "text-blue-600";
        }
    }

    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 relative group"
        >
            {/* Date Column */}
            <div className="w-12 pt-1 text-right shrink-0">
                <span className="text-[10px] font-mono text-slate-400 block">{dateStr}</span>
                <span className="text-[9px] font-mono text-slate-300 block">
                    {date.getHours().toString().padStart(2, '0')}:{date.getMinutes().toString().padStart(2, '0')}
                </span>
            </div>

            {/* Icon Node */}
            <div className={`
                w-6 h-6 rounded-full border flex items-center justify-center shrink-0 z-10 box-content bg-white
                ${metaColor}
            `}>
                {icon}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6 border-b border-slate-100 last:border-0">
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    {title}
                </p>
                {log.wish_title && (
                    <p className="text-xs text-slate-400 mt-1 pl-2 border-l-2 border-slate-100 line-clamp-1 italic">
                        "{log.wish_title}"
                    </p>
                )}
                
                <div className="mt-2 flex items-center justify-end gap-1">
                    <span className={`text-sm font-mono font-bold ${amountColor}`}>
                        {amountPrefix}{Math.floor(log.amount).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">Lm</span>
                    {/* Specific Phrasing for Outflow */}
                    {(isSender && log.type !== 'REBIRTH') && (
                        <span className="text-[10px] text-slate-400 ml-1">を分かち合いました</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
