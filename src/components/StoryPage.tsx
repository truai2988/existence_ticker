import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CHAPTERS, STORY_TITLE } from '../data/storyData';
import { ArrowLeft, Printer } from 'lucide-react';
import { Logo } from './Logo';

export const StoryPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#F9F8F4] text-[#2D2D2D] selection:bg-orange-100 selection:text-[#2D2D2D] relative overflow-x-hidden font-serif">
            {/* Washi Texture Overlay */}
            <div 
                className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-50 transition-opacity duration-1000"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/handmade-paper.png")' }}
            />

            {/* Navigation (Hidden on Print) */}
            <nav className="fixed top-0 left-0 right-0 z-[60] bg-[#F9F8F4]/80 backdrop-blur-md border-b border-[#E5E0D5] px-6 py-4 flex items-center justify-between print:hidden">
                <button 
                    onClick={() => navigate('/app')}
                    className="flex items-center gap-2 text-xs tracking-widest text-[#777777] hover:text-[#2D2D2D] transition-colors group font-sans"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    舞台（ホーム）へ戻る
                </button>
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => window.print()}
                        className="text-[#777777] hover:text-[#2D2D2D] transition-colors"
                        title="印刷する"
                    >
                        <Printer size={18} />
                    </button>
                    <span className="text-xs tracking-[0.3em] uppercase text-[#AAAAAA] hidden md:inline font-sans">
                        <Logo className="inline" /> Archive
                    </span>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-6 pt-32 pb-40 relative z-10">
                {/* Header */}
                <header className="mb-32 text-center md:text-left print:mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2 }}
                    >
                        <h1 className="text-3xl font-bold leading-relaxed mb-6 tracking-wide md:tracking-[0.1em]">
                            {STORY_TITLE}
                        </h1>
                        <div className="h-[1px] w-24 bg-[#8B6B50]/30 md:mx-0 mx-auto mb-12" />
                    </motion.div>
                </header>

                {/* Content */}
                <div className="space-y-32 md:space-y-48 print:space-y-16">
                    {CHAPTERS.map((chapter) => (
                        <motion.section 
                            key={chapter.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-10%" }}
                            transition={{ duration: 1, delay: 0.1 }}
                            className="relative"
                        >
                            <div className="mb-10 md:mb-16">
                                <span className="text-xs tracking-[0.4em] text-[#AAAAAA] uppercase mb-4 block print:text-[#666] font-sans">
                                    Chapter {chapter.id.toString().padStart(2, '0')}
                                </span>
                                <h2 className="text-3xl font-bold tracking-widest text-[#111] print:text-black">
                                    {chapter.title}
                                </h2>
                                <div className="h-[1px] w-12 bg-[#DED9D0] mt-6" />
                            </div>

                            <article className="space-y-8 text-base leading-[2.2] md:leading-[2.4] text-[#333333] tracking-wide print:text-black print:text-base print:leading-normal">
                                {chapter.content.map((p, pIdx) => (
                                    <p key={pIdx} className="indent-4 md:indent-8 text-justify">
                                        {p}
                                    </p>
                                ))}
                            </article>
                        </motion.section>
                    ))}
                </div>

                {/* Footer */}
                <footer className="mt-60 pt-20 border-t border-[#E5E0D5] text-center print:hidden">
                    <p className="text-xs tracking-[0.2em] text-[#AAAAAA] mb-12 font-sans">
                        ET: Infrastructure for the Soul
                    </p>
                    <button 
                        onClick={() => navigate('/app')}
                        className="inline-block px-12 py-5 bg-[#2D2D2D] text-white rounded-xl shadow-xl hover:bg-[#111111] transition-all tracking-[0.3em] font-medium text-base font-sans"
                    >
                        舞台へ向かう
                    </button>
                    <p className="mt-20 text-xs tracking-[0.3em] text-[#CCCCCC] uppercase font-serif">
                        © 2026 <Logo className="inline" /> Archive.
                    </p>
                </footer>
            </main>

            {/* Global Print Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        margin: 2cm;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                        font-family: "Noto Serif JP", "Husei Mincho", serif !important;
                    }
                    .print-hidden {
                        display: none !important;
                    }
                    article {
                        text-align: justify;
                        line-height: 1.6 !important;
                    }
                    section {
                        page-break-inside: avoid;
                    }
                    p {
                        margin-bottom: 1em !important;
                    }
                }
            `}} />
        </div>
    );
};
