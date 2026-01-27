import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, Megaphone, Heart, ArrowRight, ArrowDown } from 'lucide-react';

interface HomeViewProps {
    onOpenFlow: () => void;       // "Help" (Inflow)
    onOpenRequest: () => void;    // "Request" (Outflow - Contract)
    onOpenGift: () => void;       // "Gift" (Outflow - Pure)
}

export const HomeView: React.FC<HomeViewProps> = ({ onOpenFlow, onOpenRequest, onOpenGift }) => {
    return (
        <div className="flex-1 flex flex-col p-6 pt-32 pb-24 max-w-md mx-auto w-full h-full relative">
            
            {/* === CENTER VISUALIZATION: ENERGY FLOW === */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 -z-10 flex flex-col items-center justify-center opacity-10 pointer-events-none">
                 <motion.div 
                    animate={{ y: [0, 20, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center gap-4"
                 >
                    <ArrowDown size={120} className="text-slate-900" />
                 </motion.div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4 h-full">

                {/* === LEFT COLUMN: HELP (INFLOW) === */}
                <button 
                    onClick={onOpenFlow}
                    className="group relative h-full bg-blue-50/30 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:bg-blue-50/80 transition-all duration-300 border border-blue-100 flex flex-col justify-between text-left overflow-hidden active:scale-[0.98]"
                >
                    <div className="relative z-10 pt-4">
                        <div className="p-3 bg-blue-50 w-fit rounded-2xl mb-4 group-hover:bg-blue-100 transition-colors">
                            <Inbox size={28} className="text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">手伝う</h2>
                        <p className="text-xs text-slate-500 font-medium">誰かの役に立つ</p>
                    </div>
                     <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                         <div className="bg-slate-900 text-white p-2 rounded-full w-fit">
                            <ArrowRight size={16} />
                         </div>
                    </div>
                </button>

                {/* === RIGHT COLUMN: OUTFLOW (REQUEST & GIFT) === */}
                <div className="flex flex-col gap-4 h-full">
                    
                    {/* TOP: REQUEST (CONTRACT) */}
                    <button 
                        onClick={onOpenRequest}
                        className="group relative flex-1 bg-amber-50/30 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:bg-amber-50/80 transition-all duration-300 border border-amber-100 flex flex-col justify-between text-left overflow-hidden active:scale-[0.98]"
                    >
                        <div className="relative z-10 pt-2">
                             <div className="p-2.5 bg-amber-50 w-fit rounded-xl mb-3 group-hover:bg-amber-100 transition-colors">
                                <Megaphone size={24} className="text-amber-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-0.5 group-hover:text-amber-600 transition-colors">頼む</h2>
                            <p className="text-[10px] text-slate-500 font-medium">願いを託す</p>
                        </div>
                    </button>

                    {/* BOTTOM: GIFT (PURE) */}
                    <button 
                        onClick={onOpenGift}
                        className="group relative flex-none h-40 bg-pink-50/30 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:bg-pink-50/80 transition-all duration-300 border border-pink-100 flex flex-col justify-between text-left overflow-hidden active:scale-[0.98]"
                    >
                        <div className="relative z-10 pt-2">
                             <div className="p-2.5 bg-pink-50 w-fit rounded-xl mb-3 group-hover:bg-pink-100 transition-colors">
                                <Heart size={24} className="text-pink-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-0.5 group-hover:text-pink-600 transition-colors">贈る</h2>
                            <p className="text-[10px] text-slate-500 font-medium leading-tight">
                                依頼を通さず<br/>感謝を届ける
                            </p>
                        </div>
                    </button>

                </div>

            </div>
            
        </div>
    );
};
