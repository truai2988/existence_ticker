import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const TrustPage = () => {
    const { t: MESSAGES } = useLanguage();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const sectionVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="min-h-screen bg-[#F9F8F4] text-[#2D2D2D] selection:bg-orange-100 selection:text-[#2D2D2D] relative overflow-x-hidden font-serif">
            {/* Washi Texture Overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-50"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/handmade-paper.png")' }}
            />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-[60] bg-[#F9F8F4]/80 backdrop-blur-md border-b border-[#E5E0D5] px-6 py-4 flex items-center justify-between">
                <button
                    onClick={() => window.close()}
                    className="flex items-center gap-2 text-xs tracking-widest text-[#777777] hover:text-[#2D2D2D] transition-colors group font-sans"
                >
                    <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                    {MESSAGES.TRUST.NAV_CLOSE}
                </button>
                <span className="text-xs tracking-[0.3em] uppercase text-[#AAAAAA] hidden md:inline font-sans">
                    {MESSAGES.TRUST.NAV_TITLE}
                </span>
            </nav>

            <main className="max-w-2xl mx-auto px-6 pt-32 pb-40 relative z-10">

                {/* Page Header */}
                <header className="mb-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2 }}
                    >
                        <p className="text-xs tracking-[0.5em] text-[#AAAAAA] uppercase mb-6 font-sans">
                            {MESSAGES.TRUST.HEADER_SUB}
                        </p>
                        <h1 className="text-2xl md:text-3xl font-light tracking-[0.2em] text-[#1A1A1A] mb-8">
                            {MESSAGES.TRUST.HEADER_TITLE}
                        </h1>
                        <div className="h-[1px] w-16 bg-[#8B6B50]/20 mx-auto" />
                    </motion.div>
                </header>

                {/* Sections */}
                <div className="space-y-24">

                    {/* Section 1: The Gardener */}
                    <motion.section
                        variants={sectionVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-10%' }}
                        transition={{ duration: 1, delay: 0.1 }}
                    >
                        <div className="mb-8">
                            <span className="text-[10px] tracking-[0.5em] text-[#BBBBBB] uppercase block mb-3 font-sans">
                                {MESSAGES.TRUST.SEC1_SUB}
                            </span>
                            <h2 className="text-lg font-medium tracking-[0.15em] text-[#2D2D2D]">
                                {MESSAGES.TRUST.SEC1_TITLE}
                            </h2>
                            <div className="h-[1px] w-8 bg-[#DED9D0] mt-4" />
                        </div>
                        <article className="space-y-6 text-base leading-[2.4] text-[#444444] tracking-wide">
                            <p className="text-justify">
                                {MESSAGES.TRUST.SEC1_P1_1}{' '}
                                <a
                                    href="https://yori-somaru.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#8B6B50] underline underline-offset-4 decoration-[#8B6B50]/30 hover:decoration-[#8B6B50] transition-all duration-300"
                                >
                                    {MESSAGES.TRUST.SEC1_P1_2}
                                </a>{' '}
                                {MESSAGES.TRUST.SEC1_P1_3}
                            </p>
                            <p className="text-justify whitespace-pre-wrap">
                                {MESSAGES.TRUST.SEC1_P2}
                            </p>
                            <p>
                                <a
                                    href="mailto:trueeye792@gmail.com"
                                    className="text-[#8B6B50] underline underline-offset-4 decoration-[#8B6B50]/30 hover:decoration-[#8B6B50] transition-all duration-300 font-sans text-sm tracking-widest"
                                >
                                    trueeye792@gmail.com
                                </a>
                            </p>
                        </article>
                    </motion.section>

                    {/* Divider */}
                    <div className="flex items-center gap-6">
                        <div className="flex-1 h-[1px] bg-[#E5E0D5]" />
                        <div className="w-1 h-1 rounded-full bg-[#DED9D0]" />
                        <div className="flex-1 h-[1px] bg-[#E5E0D5]" />
                    </div>

                    {/* Section 2: The Covenant */}
                    <motion.section
                        variants={sectionVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-10%' }}
                        transition={{ duration: 1, delay: 0.1 }}
                    >
                        <div className="mb-8">
                            <span className="text-[10px] tracking-[0.5em] text-[#BBBBBB] uppercase block mb-3 font-sans">
                                {MESSAGES.TRUST.SEC2_SUB}
                            </span>
                            <h2 className="text-lg font-medium tracking-[0.15em] text-[#2D2D2D]">
                                {MESSAGES.TRUST.SEC2_TITLE}
                            </h2>
                            <div className="h-[1px] w-8 bg-[#DED9D0] mt-4" />
                        </div>
                        <article className="space-y-6 text-base leading-[2.4] text-[#444444] tracking-wide">
                            <p className="text-justify whitespace-pre-wrap">
                                {MESSAGES.TRUST.SEC2_P1}
                            </p>
                            <p className="text-justify whitespace-pre-wrap">
                                {MESSAGES.TRUST.SEC2_P2}
                            </p>
                        </article>
                    </motion.section>

                    {/* Divider */}
                    <div className="flex items-center gap-6">
                        <div className="flex-1 h-[1px] bg-[#E5E0D5]" />
                        <div className="w-1 h-1 rounded-full bg-[#DED9D0]" />
                        <div className="flex-1 h-[1px] bg-[#E5E0D5]" />
                    </div>

                    {/* Section 3: Privacy & Silence */}
                    <motion.section
                        variants={sectionVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-10%' }}
                        transition={{ duration: 1, delay: 0.1 }}
                    >
                        <div className="mb-8">
                            <span className="text-[10px] tracking-[0.5em] text-[#BBBBBB] uppercase block mb-3 font-sans">
                                {MESSAGES.TRUST.SEC3_SUB}
                            </span>
                            <h2 className="text-lg font-medium tracking-[0.15em] text-[#2D2D2D]">
                                {MESSAGES.TRUST.SEC3_TITLE}
                            </h2>
                            <div className="h-[1px] w-8 bg-[#DED9D0] mt-4" />
                        </div>
                        <article className="space-y-6 text-base leading-[2.4] text-[#444444] tracking-wide">
                            <p className="text-justify whitespace-pre-wrap">
                                {MESSAGES.TRUST.SEC3_P1}
                            </p>
                            <p className="text-justify whitespace-pre-wrap">
                                {MESSAGES.TRUST.SEC3_P2}
                            </p>
                        </article>
                    </motion.section>

                </div>

                {/* Footer */}
                <footer className="mt-40 pt-16 border-t border-[#E5E0D5] text-center">
                    <p className="text-xs tracking-[0.2em] text-[#AAAAAA] mb-10 font-sans">
                        {MESSAGES.TRUST.FOOTER_SUB}
                    </p>
                    <button
                        onClick={() => window.close()}
                        className="inline-block px-12 py-5 bg-[#2D2D2D] text-white rounded-xl shadow-xl hover:bg-[#111111] transition-all tracking-[0.3em] font-medium text-sm font-sans"
                    >
                        {MESSAGES.TRUST.FOOTER_BTN}
                    </button>
                    <p className="mt-16 text-xs tracking-[0.3em] text-[#CCCCCC] uppercase font-serif">
                        {MESSAGES.TRUST.FOOTER_COPY}
                    </p>
                </footer>
            </main>
        </div>
    );
};
