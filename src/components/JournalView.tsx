import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, X, Sparkles } from 'lucide-react';
import { useWishes } from '../hooks/useWishes';
import { useAuth } from '../hooks/useAuthHook';

// Data Type
type JournalEntry = {
  id: string;
  type: 'sent' | 'received' | 'decayed';
  amount: number;
  partner?: string; // Name of sender/receiver
  timestamp: string;
};

interface JournalViewProps {
  onClose: () => void;
}

// Helper for safe Date parsing
const parseDate = (val: unknown): Date => {
  if (!val) return new Date();
  
  // Check for Firestore Timestamp
  if (
      typeof val === 'object' && 
      val !== null &&
      'toDate' in val && 
      typeof (val as { toDate: unknown }).toDate === 'function'
  ) {
      return (val as { toDate: () => Date }).toDate();
  }

  // Check for toMillis
  if (
      typeof val === 'object' && 
      val !== null &&
      'toMillis' in val &&
      typeof (val as { toMillis: unknown }).toMillis === 'function'
  ) {
      return new Date((val as { toMillis: () => number }).toMillis());
  }

  // Check for seconds { seconds: number }
  if (
      typeof val === 'object' &&
      val !== null &&
      'seconds' in val &&
      typeof (val as { seconds: unknown }).seconds === 'number'
  ) {
      return new Date((val as { seconds: number }).seconds * 1000);
  }

  // String or Number (Timestamp millis)
  if (typeof val === 'string' || typeof val === 'number') {
      return new Date(val);
  }
  
  return new Date(); 
};

export const JournalView: React.FC<JournalViewProps> = ({ onClose }) => {
  const { wishes } = useWishes();
  const { user } = useAuth();
  
  const journalEntries: JournalEntry[] = useMemo(() => {
      if (!user) return [];

      const entries: JournalEntry[] = [];
      const myId = user.uid;

      wishes.forEach(wish => {
          // 1. Sent (I cast a wish -> Paid cost)
          if (wish.requester_id === myId) {
             // Cost calculation based on tier (simple map)
             const costMap = { light: 100, medium: 500, heavy: 1000 };
             const amount = (wish.cost) || costMap[wish.gratitude_preset] || 0;
             
             entries.push({
                 id: wish.id + '_sent',
                 type: 'sent',
                 amount: amount,
                 partner: wish.content.length > 15 ? wish.content.slice(0, 15) + '...' : wish.content,
                 timestamp: parseDate(wish.created_at).toLocaleDateString()
             });
          }

          // 2. Received (I helped someone -> Earned reward)
          // only if I am the helper AND it is completed? 
          // For now, if I am helper (in_progress or completed)
          if (wish.helper_id === myId) {
             const costMap = { light: 100, medium: 500, heavy: 1000 };
             // Use val_at_fulfillment if available, otherwise estimate
             const amount = (wish.val_at_fulfillment) || (wish.cost) || costMap[wish.gratitude_preset] || 0;
              
             entries.push({
                 id: wish.id + '_earned',
                 type: 'received',
                 amount: amount,
                 partner: 'Seeker', // Ideally wish.requester_id or name
                 timestamp: wish.accepted_at ? parseDate(wish.accepted_at).toLocaleDateString() : 'Pending'
             });
          }
      });

      // Sort by date desc
      return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [wishes, user]);

  return (
    <div className="fixed inset-0 h-[100dvh] z-50 flex flex-col items-center bg-black/95 backdrop-blur-md overflow-hidden animate-fade-in">
        <div className="w-full max-w-sm flex-grow flex flex-col p-6 relative overflow-y-auto no-scrollbar">
             {/* Header */}
            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4 shrink-0">

                <div>
                    <h2 className="text-2xl font-serif text-white/90">光の軌跡</h2>
                    <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">Journal of Light</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <X className="text-gray-400" size={24} />
                </button>
            </div>

            {/* Content: Constellation List */}
            <div className="flex-grow overflow-y-auto no-scrollbar relative pl-4">
                {/* The "Timeline" Line */}
                <div className="absolute left-[27px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-gold-400/20 to-transparent"></div>

                <div className="space-y-8 py-4">
                    {journalEntries.length === 0 ? (
                        <p className="text-gray-500 text-center text-sm py-10">
                            まだ軌跡（履歴）はありません。
                        </p>
                    ) : (
                        journalEntries.map((entry, index) => (
                        <motion.div 
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-4 relative group"
                        >
                            {/* Node/Star on the timeline */}
                            <div className={`
                                w-3 h-3 rounded-full border transform -translate-x-[1.5px] z-10 box-content
                                ${entry.type === 'sent' ? 'bg-black border-gold-400 shadow-[0_0_10px_#fbbf24]' : ''}
                                ${entry.type === 'received' ? 'bg-gold-100 border-white shadow-[0_0_15px_white]' : ''}
                                ${entry.type === 'decayed' ? 'bg-gray-900 border-gray-700 w-2 h-2 ml-0.5' : ''}
                            `}></div>

                            {/* Line connector for visual flair */}
                            <div className="w-4 h-[1px] bg-white/5 group-hover:bg-white/10 transition-colors"></div>

                            {/* Card Content */}
                            <div className="flex-1 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <EntryIcon type={entry.type} />
                                        <span className={`text-sm font-medium ${entry.type === 'decayed' ? 'text-gray-500' : 'text-gray-200'}`}>
                                            {GetEntryTitle(entry)}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-600 font-mono">{entry.timestamp}</p>
                                </div>
                                
                                <span className={`text-sm font-light font-mono ${entry.type === 'sent' ? 'text-gold-500' : entry.type === 'received' ? 'text-white' : 'text-gray-700'}`}>
                                    {entry.type === 'sent' ? '-' : entry.type === 'decayed' ? '-' : '+'}{entry.amount}
                                </span>
                            </div>
                        </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

// Helpers
const EntryIcon = ({ type }: { type: JournalEntry['type'] }) => {
    switch (type) {
        case 'sent': return <ArrowUpRight size={12} className="text-gold-500" />;
        case 'received': return <ArrowDownLeft size={12} className="text-white" />;
        case 'decayed': return <Sparkles size={10} className="text-gray-700 opacity-50" />;
    }
};

const GetEntryTitle = (entry: JournalEntry) => {
    switch (entry.type) {
        case 'sent': return `To: ${entry.partner}`;
        case 'received': return `From: ${entry.partner}`;
        case 'decayed': return '自然減価 (Entropy)';
    }
};
