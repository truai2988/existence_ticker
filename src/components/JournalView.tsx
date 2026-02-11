import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuthHook';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, getDoc, doc, Timestamp } from 'firebase/firestore';
import { HeaderNavigation } from './HeaderNavigation';
import { AppViewMode, Wish } from '../types';
import { WishCard } from './WishCard';
import { X, Sun, Heart, Sparkles, CheckCircle2, Archive, Slash } from 'lucide-react';

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
  wish_id?: string;
  description?: string;
};

interface JournalViewProps {
  onTabChange?: (mode: AppViewMode) => void;
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

export const JournalView: React.FC<JournalViewProps> = ({ onTabChange }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWishId, setSelectedWishId] = useState<string | null>(null);

  useEffect(() => {
     if (!user || !db) return;
     
     const txRef = collection(db, 'transactions');
     
     const qSent = query(txRef, where('sender_id', '==', user.uid), orderBy('created_at', 'desc'), limit(50));
     const qReceived = query(txRef, where('recipient_id', '==', user.uid), orderBy('created_at', 'desc'), limit(50));
     
     let sentData: TransactionLog[] = [];
     let receivedData: TransactionLog[] = [];

     const updateState = () => {
         const validData = [...sentData, ...receivedData];
         const uniqueById = Array.from(new Map(validData.map(item => [item.id, item])).values());
         const sorted = uniqueById.sort((a, b) => {
             const tA = parseDate(a.created_at).getTime();
             const tB = parseDate(b.created_at).getTime();
             return tB - tA;
         });

         const cleanLogs: TransactionLog[] = [];
         sorted.forEach((current, i) => {
             if (i === 0) {
                 cleanLogs.push(current);
                 return;
             }
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
         setLogs(cleanLogs);
         setIsLoading(false);
     };

     const u1 = onSnapshot(qSent, (snap) => {
         sentData = snap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionLog));
         updateState();
     });
     
     const u2 = onSnapshot(qReceived, (snap) => {
         receivedData = snap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionLog));
         updateState();
     });

     return () => { u1(); u2(); };
  }, [user]);

   return (
    <div className="flex-1 flex flex-col w-full h-full relative">
        {/* Wish Detail Modal Overlay */}
        {selectedWishId && (
            <WishViewerModal wishId={selectedWishId} onClose={() => setSelectedWishId(null)} currentUserId={user?.uid || ''} />
        )}
        {/* Subtle Section Header with Navigation */}
        <div className="border-b border-slate-100 bg-white/50">
            <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
                 <div>
                    <h2 className="text-sm font-bold tracking-widest uppercase text-slate-900">Journal</h2>
                    <p className="text-xs text-slate-500 font-mono tracking-[0.2em] uppercase">あなたの歩みの記録</p>
                </div>
                {onTabChange && (
                    <div className="shrink-0">
                        <HeaderNavigation 
                            currentTab="history" 
                            onTabChange={(tab: AppViewMode) => onTabChange(tab)} 
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Content Container */}
        <div className="w-full flex-grow overflow-y-auto no-scrollbar relative flex flex-col items-center">
             <div className="w-full max-w-2xl flex-grow p-6 pt-4 pb-24 relative">
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
                           <LogItem 
                                key={log.id} 
                                log={log} 
                                index={index} 
                                userId={user?.uid || ''} 
                                onSelectWish={(id) => setSelectedWishId(id)}
                           />
                        ))
                    )}
                </div>
             </div>
        </div>
    </div>
  );
};

const LogItem = ({ 
    log, 
    index, 
    userId, 
    onSelectWish 
}: { 
    log: TransactionLog, 
    index: number, 
    userId: string, 
    onSelectWish: (id: string) => void 
}) => {
    const isSender = log.sender_id === userId;
    const date = parseDate(log.created_at);
    const dateStr = formatDate(date);
    const partnerName = (isSender ? log.recipient_name : log.sender_name) || '誰か';

    let icon, title, metaColor, amountPrefix, amountColor;

    if (log.type === 'REBIRTH') {
        icon = <Sun size={14} className="text-amber-500 fill-amber-100" />;
        title = "太陽の光で器が満たされました（リセット）";
        metaColor = "bg-amber-50 border-amber-200";
        amountPrefix = "+";
        amountColor = "text-amber-600";
    } 
    else if (log.type === 'GIFT') {
        if (isSender) {
            icon = <Heart size={14} className="text-pink-500 fill-pink-50" />;
            title = `${partnerName}さんに光を贈りました（旧機能）`;
            metaColor = "bg-slate-50 border-slate-200 grayscale";
            amountPrefix = "";
            amountColor = "text-slate-400";
        } else {
            icon = <Sparkles size={14} className="text-cyan-500 fill-cyan-50" />;
            title = `${partnerName}さんから光を預かりました（旧機能）`;
            metaColor = "bg-slate-50 border-slate-200 grayscale";
            amountPrefix = "+";
            amountColor = "text-cyan-600";
        }
    } 
    else if (log.type === 'WISH_CANCELLED' || (log.amount === 0 && log.type === 'WISH_FULFILLMENT')) {
        icon = <Slash size={14} className="text-slate-300" />;
        title = log.wish_title ? `「${log.wish_title}」を取り下げました` : "願いを取り下げました";
        metaColor = "bg-slate-50 border-slate-100";
        amountPrefix = "";
        amountColor = "text-slate-400";
    }
    else if (log.type === 'WISH_EXPIRED') {
        icon = <Archive size={14} className="text-slate-300" />;
        title = log.wish_title ? `「${log.wish_title}」が期限切れになりました` : "願いが期限切れになりました";
        metaColor = "bg-slate-50 border-slate-100";
        amountPrefix = "";
        amountColor = "text-slate-400";
    }
    else if (log.type === 'COMPENSATION') {
        if (isSender) {
             icon = <CheckCircle2 size={14} className="text-red-400" />;
             title = `${partnerName}さんにお詫びのしるしを渡しました`;
             metaColor = "bg-red-50 border-red-100";
             amountPrefix = ""; 
             amountColor = "text-red-500";
        } else {
             icon = <Sun size={14} className="text-orange-500 fill-orange-50" />;
             title = `${partnerName}さんからお詫びのしるしを受け取りました`;
             metaColor = "bg-orange-50 border-orange-100";
             amountPrefix = "+";
             amountColor = "text-orange-600";
        }
    }
    else {
        if (isSender) {
             icon = <CheckCircle2 size={14} className="text-amber-600" />;
             title = `${partnerName}さんに感謝を伝えました（依頼完了）`;
             metaColor = "bg-amber-50 border-amber-200";
             amountPrefix = "";
             amountColor = "text-slate-400";
        } else {
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
            onClick={() => log.wish_id && onSelectWish(log.wish_id)}
            className={`flex items-start gap-3 relative group transition-all rounded-xl p-2 -ml-2 ${log.wish_id ? 'cursor-pointer hover:bg-white/40 active:scale-[0.98]' : ''}`}
        >
            <div className="w-12 pt-1 text-right shrink-0">
                <span className="text-xs font-mono text-slate-400 block">{dateStr}</span>
                <span className="text-xs font-mono text-slate-300 block">
                    {date.getHours().toString().padStart(2, '0')}:{date.getMinutes().toString().padStart(2, '0')}
                </span>
            </div>
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 z-10 box-content bg-white ${metaColor}`}>
                {icon}
            </div>
            <div className="flex-1 pb-6 border-b border-slate-100 last:border-0">
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{title}</p>
                {log.wish_title && log.type !== 'WISH_CANCELLED' && log.type !== 'WISH_EXPIRED' && (
                    <p className="text-xs text-slate-400 mt-1 pl-2 border-l-2 border-slate-100 line-clamp-1 italic">
                        "{log.wish_title}"
                    </p>
                )}
                <div className="mt-2 flex items-center justify-end gap-1">
                    {log.amount === 0 ? (
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest pl-2">
                           {log.type === 'WISH_EXPIRED' ? '期限切れ' : '取り下げ'}
                        </span>
                    ) : (
                        <>
                            <span className={`text-sm font-mono font-bold ${amountColor}`}>
                                {amountPrefix}{Math.floor(log.amount).toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400">Lm</span>
                            {(isSender && log.type !== 'REBIRTH') && (
                                <span className="text-xs text-slate-400 ml-1">を分かち合いました</span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// --- Wish Detail Modal (Internal) ---
const WishViewerModal = ({ wishId, onClose, currentUserId }: { wishId: string, onClose: () => void, currentUserId: string }) => {
    const [wish, setWish] = useState<Wish | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWish = async () => {
            if (!db) return;
            try {
                const snap = await getDoc(doc(db, 'wishes', wishId));
                if (snap.exists()) {
                    setWish({ id: snap.id, ...snap.data() } as Wish);
                }
            } catch (e) {
                console.error("Failed to fetch wish", e);
            } finally {
                setLoading(false);
            }
        };
        fetchWish();
    }, [wishId]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    return (
        <div 
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 p-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase pl-2">
                        追憶の欠片 (Past Fragment)
                    </span>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-2">
                    {loading ? (
                        <div className="h-40 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                        </div>
                    ) : wish ? (
                        <WishCard 
                            wish={wish} 
                            currentUserId={currentUserId} 
                            isReadOnly={true}
                        />
                    ) : (
                        <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                            記録が見つかりませんでした
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
