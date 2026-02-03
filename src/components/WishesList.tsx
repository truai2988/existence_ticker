import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, User, Handshake, MapPin } from "lucide-react";
import { useWishes } from '../hooks/useWishes';
import { WishCard } from './WishCard';
import { PresenceModal } from './PresenceModal';

type TabType = 'all' | 'mine' | 'accepted';

interface WishesListProps {
  currentUserId: string;
}

export const WishesList = ({ currentUserId }: WishesListProps) => {
  const { wishes } = useWishes();
  
  // Local state only for UI interactions, not data
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showPresence, setShowPresence] = useState(false);
  


  // Filter Logic
  const filteredWishes = wishes.filter(wish => {
      // Use real IDs
      
      if (activeTab === 'all') {
          return wish.status === 'open';
      }
      if (activeTab === 'mine') {
          return wish.requester_id === currentUserId;
      }
      if (activeTab === 'accepted') {
          return wish.status === 'in_progress' && (
              wish.helper_id === currentUserId || wish.requester_id === currentUserId
            );
      }
      return true;
  });

  // Render Logic for Contract Tab
  const renderContractTabContent = () => {
    const effectiveUserId = currentUserId;
    // 1. Quests (I help others)
    const myQuests = filteredWishes.filter(w => w.helper_id === effectiveUserId);
    // 2. Requests (Others help me)
    const myRequests = filteredWishes.filter(w => w.requester_id === effectiveUserId);

    if (myQuests.length === 0 && myRequests.length === 0) {
      return (
        <div className="text-center py-20 px-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <p className="text-slate-500 text-sm">現在進行中の契約はありません。</p>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in">
        
        {/* Section A: Quests (You Help) */}
        {myQuests.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-bold text-yellow-500 uppercase tracking-widest pl-1">
              <Handshake className="w-4 h-4" />
              遂行中のクエスト
            </h3>
            {myQuests.map(wish => (
                <motion.div
                    key={wish.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-[350px] mx-auto"
                >
                  <WishCard 
                    wish={wish} 
                    currentUserId={effectiveUserId} 
                  />
              </motion.div>
            ))}
          </div>
        )}

        {/* Section B: Requests (You rely on others) */}
        {myRequests.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pl-1 border-b border-slate-800 pb-1 mb-2 mt-6">
              <User className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                進行中の依頼 (待機中)
              </h3>
            </div>
            
            {myRequests.map(wish => (
                <motion.div
                    key={wish.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-[350px] mx-auto opacity-80 hover:opacity-100 transition-opacity"
                >
                 <WishCard 
                   wish={wish} 
                   currentUserId={effectiveUserId} 
                 />
                 <p className="text-[11px] text-center text-green-500 mt-2 font-mono flex items-center justify-center gap-1">
                   {/* Loader2 removed from imports, using simple text or re-add if needed. Re-adding minimal spinner if desired but simpler is better */}
                   担当者が決定しました。作業完了を待ってください。
                 </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col relative pb-24">
      {/* Header / Tab Navigation */}
      <div className="p-4 bg-slate-950/80 backdrop-blur-md border-b border-t border-slate-900 sticky top-0 z-30 shadow-lg shrink-0">
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-xl font-serif text-gold-400 tracking-widest flex items-center gap-2">
                <Sparkles size={18} />
                <span>WISHES</span>
            </h2>
            
            <button 
                onClick={() => setShowPresence(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-full transition-all group"
            >
                <MapPin size={14} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                <span className="text-[11px] text-slate-500 group-hover:text-slate-300 font-medium">
                    近くの気配を確認する
                </span>
            </button>
          </div>

          <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
            <button
            onClick={() => setActiveTab('all')}
            className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-300
                ${activeTab === 'all' 
                ? 'bg-slate-800 text-yellow-400 shadow-sm ring-1 ring-yellow-500/20' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                }
            `}
            >
            <Sparkles className="w-3.5 h-3.5" />
            <span>星々</span>
            </button>

            <button
            onClick={() => setActiveTab('mine')}
            className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-300
                ${activeTab === 'mine' 
                ? 'bg-slate-800 text-yellow-400 shadow-sm ring-1 ring-yellow-500/20' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                }
            `}
            >
            <User className="w-3.5 h-3.5" />
            <span>私の願い</span>
            </button>

            <button
            onClick={() => setActiveTab('accepted')}
            className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-300
                ${activeTab === 'accepted' 
                ? 'bg-slate-800 text-yellow-400 shadow-sm ring-1 ring-yellow-500/20' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                }
            `}
            >
            <Handshake className="w-3.5 h-3.5" />
            <span>契約中</span>
            </button>
          </div>
      </div>

      {/* Main Content: Wish List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
        
        {activeTab === 'accepted' ? (
            renderContractTabContent()
        ) : (
            filteredWishes.length === 0 ? (
                <div className="text-center py-20 px-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                <p className="text-slate-500 text-sm mb-2">
                    {activeTab === 'all' && '現在、輝く星は見当たりません。'}
                    {activeTab === 'mine' && 'あなたはまだ願いを放っていません。'}
                </p>
                {activeTab === 'mine' && (
                    <p className="text-xs text-slate-600">
                    East (右) の軌道から、最初の願いを灯してみましょう。
                    </p>
                )}
                </div>
            ) : (
                filteredWishes.map((wish, index) => (
                    <motion.div
                    key={wish.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-full max-w-[350px] mx-auto mb-4"
                    >
                        <WishCard 
                            wish={wish} 
                            currentUserId={currentUserId} 
                        />
                    </motion.div>
                ))
            )
        )}
      </div>
      {/* Modals */}
      <AnimatePresence>
        {showPresence && <PresenceModal onClose={() => setShowPresence(false)} />}
      </AnimatePresence>
    </div>
  );
};
