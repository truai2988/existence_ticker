import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, Sparkles, ArrowRight, ArrowDown } from 'lucide-react';

interface HomeViewProps {
    onOpenFlow: () => void;   // "Earn" -> List
    onOpenCreate: () => void; // "Spend" -> Create Form
}

export const HomeView: React.FC<HomeViewProps> = ({ onOpenFlow, onOpenCreate }) => {
    return (
        <div className="flex-1 flex flex-col p-6 pt-32 pb-24 max-w-md mx-auto w-full h-full relative">
            
            {/* === CENTER VISUALIZATION: ENERGY FLOW === */}
            {/* Simplified Toyota-like flow concept: A loop or exchange */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 -z-10 flex flex-col items-center justify-center opacity-10 pointer-events-none">
                 <motion.div 
                    animate={{ y: [0, 20, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center gap-4"
                 >
                    <ArrowDown size={120} className="text-slate-900" />
                 </motion.div>
            </div>

            <div className="flex-1 flex flex-col gap-6 justify-center">

                {/* === CARD 1: EARN (INFLOW) === */}
                <button 
                    onClick={onOpenFlow}
                    className="group relative w-full bg-blue-50/30 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:bg-blue-50/80 transition-all duration-300 border border-blue-100 flex flex-col items-start text-left overflow-hidden active:scale-[0.98]"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-30 transition-opacity transform group-hover:scale-110 duration-500">
                        <Inbox size={120} className="text-blue-900" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="p-3 bg-blue-50 w-fit rounded-2xl mb-4 group-hover:bg-blue-100 transition-colors">
                            <Inbox size={32} className="text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">手伝う</h2>
                        <p className="text-sm text-slate-500 font-medium">誰かの役に立つ</p>
                    </div>

                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                         <div className="bg-slate-900 text-white p-2 rounded-full">
                            <ArrowRight size={20} />
                         </div>
                    </div>
                </button>

                {/* === CARD 2: SPEND (OUTFLOW) === */}
                <button 
                    onClick={onOpenCreate}
                    className="group relative w-full bg-orange-50/30 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:bg-orange-50/80 transition-all duration-300 border border-orange-100 flex flex-col items-start text-left overflow-hidden active:scale-[0.98]"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-30 transition-opacity transform group-hover:scale-110 duration-500">
                        <Sparkles size={120} className="text-amber-600" />
                    </div>
                    
                    <div className="relative z-10">
                         <div className="p-3 bg-amber-50 w-fit rounded-2xl mb-4 group-hover:bg-amber-100 transition-colors">
                            <Sparkles size={32} className="text-amber-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition-colors">頼む・贈る</h2>
                        <p className="text-sm text-slate-500 font-medium">願いを放つ・寄付</p>
                    </div>

                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                         <div className="bg-amber-500 text-white p-2 rounded-full">
                            <ArrowRight size={20} />
                         </div>
                    </div>
                </button>

            </div>

             {/* Footer Spacer is handled by padding-bottom */}
        </div>
    );
};
