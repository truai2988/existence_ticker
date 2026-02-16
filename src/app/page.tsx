import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, animate, AnimatePresence } from 'framer-motion';
import { ArrowDown, Droplets, HeartHandshake, Sparkles, Send, Sun, Heart, Smile, Users } from 'lucide-react';

export const LandingPage = () => {
  // --- A-Side: Ten-Day Lapse (Pure Abundance) ---
  const [lumens, setLumens] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    // Allow animation to finish before navigating
    setTimeout(() => {
        navigate('/app');
    }, 1500);
  };
  
  useEffect(() => {
    let timeoutId: number;
    // Stage 1: Initial Filling (0.00 -> 2400.00 in 3s)
    const controls = animate(0, 2400, {
        duration: 3,
        ease: "easeOut",
        onUpdate(value) {
            // Count up in increments of 100 to keep lower 4 'digits' at 00.00
            setLumens(Math.floor(value / 100) * 100);
        },
        onComplete() {
            setLumens(2400); // Ensure it ends at exactly 2400.00
            setShowFlash(true);
            
            // Delay the start of decay by 1 second after filling/flash starts
            timeoutId = window.setTimeout(() => {
                setIsInitialized(true);
            }, 1000);
        }
    });

    return () => {
        controls.stop();
        if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    // Stage 2: Real-time Flow (1 hour = 10 Lm flows to the world)
    const DECAY_PER_10MS = 0.0000277777;

    const interval = setInterval(() => {
      setLumens(prev => {
        const next = prev - DECAY_PER_10MS;
        return next > 0 ? next : 0;
      });
    }, 10);

    return () => clearInterval(interval);
  }, [isInitialized]);

  const formattedLumens = lumens.toFixed(2);
  const [bigPart, smallPart] = formattedLumens.split('.');

  // --- Scroll Animations ---
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scaleHero = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  
  return (
    <div ref={containerRef} className="bg-[#F9F8F4] min-h-screen text-[#2D2D2D] font-sans selection:bg-orange-100 selection:text-[#2D2D2D] overflow-x-hidden relative">
      
      {/* --- Ambient: Daybreak Noise & The Tide --- */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 mix-blend-multiply" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")` }}>
      </div>
      
      {/* The Tide Animation (Ripples of Light) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
         {[...Array(3)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute border border-orange-100/30 rounded-full"
                initial={{ width: '0%', height: '0%', opacity: 0.8 }}
                animate={{ width: '150vw', height: '150vw', opacity: 0 }}
                transition={{ 
                    duration: 15, 
                    repeat: Infinity, 
                    ease: "easeOut", 
                    delay: i * 5 
                }}
            />
         ))}
      </div>

      {/* Golden Dawn Flash Effect (Enhanced) */}
      {showFlash && (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
                opacity: [0, 1, 0],
                scale: [0.8, 1.2, 1.5]
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            onAnimationComplete={() => setShowFlash(false)}
            className="fixed inset-0 z-[100] bg-gradient-to-r from-orange-200/50 via-white/80 to-orange-200/50 pointer-events-none mix-blend-screen overflow-hidden"
        />
      )}

      {/* --- A-Side: The Amber Core (Hero Section) --- */}
      <section className="h-[90vh] md:h-screen flex flex-col items-center justify-center sticky top-0 z-10">
        <motion.div 
          style={{ opacity: opacityHero, scale: scaleHero }}
          className="flex flex-col items-center text-center px-4 relative w-full"
        >
            <div className="mb-10 md:mb-20 space-y-4 md:space-y-6">
                <h1 className="text-[13px] md:text-base font-medium md:font-light tracking-[0.3em] md:tracking-[0.4em] text-[#444444] md:text-[#888888] uppercase font-serif">
                    EXISTENCE TICKER
                </h1>
            </div>

            {/* The Massive Vessel of Light */}
            <div className="relative group cursor-default mb-10 md:mb-16">
                {/* Core Amber Glow (Bloom) */}
                <motion.div 
                    animate={{ opacity: [0.3, 0.5, 0.3], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-amber-200/25 blur-[50px] md:blur-[100px] rounded-full mix-blend-multiply"
                />
                
                <div className="relative z-10 flex items-baseline justify-center font-serif tracking-tight leading-none">
                        <motion.div 
                            animate={{ 
                                textShadow: [
                                    "0 0 30px rgba(255,190,100,0.05)",
                                    "0 0 60px rgba(255,210,140,0.15)",
                                    "0 0 30px rgba(255,190,100,0.05)"
                                ]
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="flex items-baseline pb-2 md:pb-4"
                        >
                            <span className="text-[16vmin] md:text-[12vmin] font-medium md:font-extralight tabular-nums bg-gradient-to-b from-[#111111] via-[#4A4A4A] to-[#6B5A4F] bg-clip-text text-transparent pb-4 md:pb-8 leading-tight">
                                {bigPart}
                            </span>
                            <span className="text-[7vmin] md:text-[5vmin] font-medium md:font-extralight tabular-nums ml-1 bg-gradient-to-b from-[#111111] via-[#4A4A4A] to-[#6B5A4F] bg-clip-text text-transparent opacity-90 pb-2 md:pb-4 leading-tight">
                                .{smallPart}
                            </span>
                        </motion.div>
                    
                    {/* Living Unit: Lm */}
                    <motion.span 
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="text-[15px] md:text-xl font-medium md:font-light text-[#6A5F51] md:text-[#A89F91] ml-2 md:ml-4 mb-2 md:mb-4 italic tracking-widest"
                    >
                        Lm
                    </motion.span>
                </div>
            </div>

            {/* Mutual Aid Infrastructure Message */}
            <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto mb-10 md:mb-20">
                <p className="text-[18px] md:text-xl leading-relaxed md:leading-[2.2] tracking-wide font-serif text-[#222222] md:text-[#444444]">
                    これは、いわゆる地域通貨ではありません。
                    <br className="hidden md:block" />
                    生きていくことを、みんなで支え合うための
                    <span className="text-[#8B6B50] md:text-[#9C7C60] font-semibold md:font-medium">『互助インフラ』</span>
                    です。
                </p>
            </div>

            <motion.div 
                animate={{ y: [0, 8, 0], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[#AAAAAA]"
            >
                <ArrowDown size={20} className="stroke-[1px]" />
            </motion.div>
        </motion.div>
      </section>

      {/* --- B-Side: Scroll Manifesto (Content Section) --- */}
      <div className="relative z-20 bg-[#F9F8F4]/90 backdrop-blur-md min-h-screen">
        
        {/* Philosophy Section: Repayment (返済) */}
        <Section className="py-12 md:py-40 flex flex-col items-center text-center px-6 min-h-[50vh] md:min-h-[60vh] justify-center">
          <div className="max-w-2xl mx-auto font-serif text-[#555555]">
            <div className="mb-6 md:mb-12 space-y-4 md:space-y-6">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 1.5, delay: 0, ease: "easeOut" }}
                className="text-xl md:text-2xl font-medium md:font-normal leading-relaxed tracking-wide md:tracking-[0.15em] text-[#111111] md:text-[#444444]"
              >
                <span className="inline-block">私たちは</span>
                <span className="inline-block">「返済」を</span>
                <span className="inline-block">しなければ、</span>
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                className="text-xl md:text-2xl font-medium md:font-normal leading-relaxed tracking-wide md:tracking-[0.15em] text-[#111111] md:text-[#444444]"
              >
                <span className="inline-block">生きてはいけないの</span>
                <span className="inline-block">でしょうか。</span>
              </motion.p>
            </div>
            
            <div className="space-y-4 md:space-y-4">
              {[
                ["窓から差し込む", "陽だまりや、"],
                ["深く吸い込む", "朝の空気。"],
                ["命の根源に、"],
                ["「返済」の義務はありません。"],
                ["本来、ただ生きているだけで、", "価値は溢れているもの。"],
                ["授かった光を、", "無理に返すのではなく、"],
                ["次の誰かへと巡らせる。"],
                ["その「巡り」が、", "新しいご縁を編み上げます。"]
              ].map((phraseGroup, index) => (
                <motion.p
                   key={index}
                   initial={{ opacity: 0, y: 10 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true, margin: "-10%" }}
                   transition={{ duration: 1.2, delay: (index + 2) * 0.4, ease: "easeOut" }}
                   className={`${index === 3 || index === 4 || index === 5 ? 'mb-6 md:mb-8' : ''} text-[15px] md:text-lg font-medium md:font-normal leading-relaxed tracking-widest text-[#222222] md:text-[#444444] md:opacity-90`}
                >
                  {phraseGroup.map((phrase, pIdx) => (
                    <span key={pIdx} className="inline-block">{phrase}</span>
                  ))}
                </motion.p>
              ))}
            </div>
          </div>
        </Section>

        {/* The Message: Soul Translation */}
        <Section className="py-12 md:py-20 flex flex-col items-center text-center px-6 max-w-3xl mx-auto">
          <div className="space-y-4 md:space-y-6 max-w-md mx-auto font-serif">
            <p className="text-lg md:text-lg font-semibold md:font-light tracking-[0.08em] text-[#111111] md:text-[#555555] leading-loose">
              「源気」を、どこへ向けますか?
            </p>
            <div className="h-[1px] w-8 bg-[#BBBBBB] md:bg-[#DDDDDD] mx-auto opacity-50"></div>
            <p className="text-base md:text-base font-normal text-[#111111] md:text-[#666666] leading-relaxed tracking-normal">
              <span className="md:whitespace-nowrap font-medium md:font-normal">2,400 Lm という持ち分は、あなたが何もしなくても、</span>
              <br />
              十日ごとに新しく入れ替わります。
              <br />
              それは、あなたが今日も源気で、ここにいることへの
              <span className="text-[#8B6B50] md:text-[#9C7C60] font-bold md:font-medium">「蓄え」</span>
              です。
            </p>
          </div>
        </Section>

        {/* The 3 Laws (Rebranded + Mutual Aid Refinement) */}
        <Section className="py-16 md:py-24 px-6 max-w-6xl mx-auto w-full border-t border-[#EAEAEA]">
          <div className="mb-12 md:mb-16 text-center">
             <h2 className="text-2xl md:text-3xl font-serif font-medium text-[#222222] mb-4">源気の循環</h2>
             <p className="text-[15px] md:text-base text-[#666666] font-sans">Cycle of Source Energy</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 md:gap-12">
            <FeatureCard 
              icon={<Sun size={32} className="text-orange-300 stroke-[1.5px]" />}
              title="満たし (Blessing)"
              desc="十日に一度、あなたの器は 2,400 Lm の光で満たされます。"
            />
            <FeatureCard 
              icon={<Droplets size={32} className="text-blue-300 stroke-[1.5px]" />}
              title="巡り (Flow)"
              desc="一時間ごとに 10 Lm が、社会という海へ還っていきます。"
            />
            <FeatureCard 
              icon={<HeartHandshake size={32} className="text-rose-300 stroke-[1.5px]" />}
              title="結び (Connection)"
              desc="誰かに手渡すことでしか、この光は守れない。具体的に誰かに託すとき、ギフトとしての温もりが生まれます。"
            />
          </div>
        </Section>

        {/* Scenarios of Mutual Aid (Shiori Cards) */}
        <Section className="py-16 md:py-24 px-6 bg-[#F5F4F0] border-y border-[#EAEAEA]">
             <div className="max-w-5xl mx-auto mb-12 md:mb-16 text-center">
                 <h2 className="text-2xl md:text-3xl font-serif font-medium text-[#222222] mb-4">互助の循環</h2>
                 <p className="text-[15px] md:text-base text-[#666666] font-sans">Scenarios of Support</p>
             </div>

             <div className="max-w-5xl mx-auto flex flex-col md:grid md:grid-cols-3 gap-8 md:gap-8 mb-12 md:mb-16 px-0 md:px-0">
                <ScenarioCard 
                    icon={<Smile size={28} />}
                    label="100 Lm：軽い手助け"
                    desc="「ちょっと助かったよ」というお礼に。スマホの操作や、重い荷物運び、日常の「ありがとう」を光に託します。"
                    color="text-orange-500"
                />
                <ScenarioCard 
                    icon={<Users size={28} />}
                    label="500 Lm：しっかりした仕事"
                    desc="約2日分のエネルギーを贈る、まとまった感謝に。草むしりや片付け、趣味の相談など、相手の時間を大切に受け取ったときに。"
                    color="text-blue-500"
                />
                <ScenarioCard 
                    icon={<Heart size={28} />}
                    label="1,000 Lm：深い献身"
                    desc="約4日分の生命力を託す、最大級の信頼。専門的な支えや、数日にわたる見守りなど、人生の節目を助け合うための光です。"
                    color="text-rose-500"
                />
             </div>
             <p className="text-center text-[15px] md:text-base text-[#111111] md:text-[#888888] font-medium md:font-normal tracking-[0.1em] md:tracking-[0.2em] font-serif italic leading-relaxed px-2 md:px-4">
                あなたの器（2,400 Lm）から溢れる光を、自由な感性で巡らせてください。
             </p>
        </Section>


        {/* --- C-Side: Waitlist Section --- */}
        <Section className="py-24 flex flex-col items-center text-center px-6 bg-gradient-to-b from-transparent to-[#EBE9E4]/40">
            <div className="bg-white p-6 rounded-full mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] mx-auto w-fit">
                <Sparkles size={24} className="text-[#C5A065] stroke-[1px]" />
            </div>
            
            <h3 className="text-xl md:text-base font-bold md:font-light tracking-[0.1em] md:tracking-[0.3em] text-[#111111] md:text-[#444444] mb-8 uppercase font-serif">
                Phase 2: Invite Only
            </h3>
            <p className="text-[#111111] md:text-[#888888] mb-12 font-medium md:font-normal tracking-wide text-[16px] md:text-sm leading-relaxed max-w-lg mx-auto font-sans">
                30名の仲間と共に、新しい支え合いの形を実験しています。<br/>
                現在は招待制での運用準備中です。
            </p>

            <form className="w-full max-w-2xl mx-auto group/form relative" onSubmit={(e) => e.preventDefault()}>
                <div className="relative flex flex-col sm:flex-row items-stretch bg-white rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.02)] p-2 transition-all duration-700 hover:shadow-[inset_0_2px_15px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.04)] border border-orange-100/20">
                    <input 
                        type="email" 
                        placeholder="your@email.com" 
                        className="flex-1 bg-transparent px-8 py-6 md:py-5 text-[#111111] md:text-[#2D2D2D] placeholder:text-[#AAAAAA] md:placeholder:text-[#CCCCCC] outline-none text-lg md:text-base tracking-[0.1em] font-serif"
                    />
                    <button className="group relative px-10 py-6 md:py-5 rounded-xl bg-[#111111] md:bg-[#2D2D2D] text-white text-[15px] md:text-xs font-bold tracking-[0.2em] overflow-hidden transition-all hover:bg-black mt-2 md:mt-0">
                        <span className="relative z-10 flex items-center justify-center gap-4">
                             ご縁を結ぶ <Send className="w-[18px] h-[18px] md:w-[14px] md:h-[14px] group-hover:translate-x-1 transition-transform stroke-[2px] md:stroke-[1.5px]" />
                        </span>
                        
                        {/* Golden Glow: Heat of life warmth */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-200/10 to-amber-400/0 opacity-0 group-hover:opacity-100 group-hover:translate-x-[100%] transition-all duration-1000 ease-in-out"></div>
                    </button>
                </div>
            </form>
        </Section>

        {/* Footer */}
        <footer className="py-12 text-center border-t border-[#EAEAEA]">
            <div className="mb-8">
                <button 
                  onClick={handleNavigate} 
                  className="group relative inline-block px-12 py-5 bg-white border border-[#E5E5E5] rounded-xl hover:shadow-2xl transition-all duration-700 tracking-[0.2em] text-[11px] uppercase text-[#777777] hover:text-[#2D2D2D] overflow-hidden"
                >
                  <span className="relative z-10">ご縁を結ぶ</span>
                  
                  {/* Mizuhiki / Red Thread Animation */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                      <motion.svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                          <motion.path 
                             d="M 0 30 Q 50 10 100 30 T 200 30" 
                             stroke="rgba(220,50,50,0.3)" 
                             strokeWidth="0.5" 
                             fill="transparent"
                             initial={{ pathLength: 0 }}
                             whileHover={{ pathLength: 1 }}
                             transition={{ duration: 1.5, ease: "easeInOut" }}
                          />
                          <motion.path 
                             d="M 0 30 Q 50 50 100 30 T 200 30" 
                             stroke="rgba(220,50,50,0.2)" 
                             strokeWidth="0.5" 
                             fill="transparent"
                             initial={{ pathLength: 0 }}
                             whileHover={{ pathLength: 1.2 }}
                             transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
                          />
                      </motion.svg>
                  </div>
                  
                  {/* Porcelain Sheen */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                </button>
            </div>
            <p className="text-[10px] text-[#AAAAAA] tracking-[0.2em] uppercase font-serif">
                © 2026 Existence Ticker.
            </p>
        </footer>

      </div>

      {/* Full screen fade to Porcelain White */}
      <AnimatePresence>
        {isExiting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[1000] bg-[#F9F8F4] pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Helper Components ---

const ScenarioCard = ({ icon, label, desc, color }: { icon: React.ReactNode, label: string, desc: string, color: string }) => {
  return (
    <div className="w-full md:aspect-square p-0 md:p-6 bg-transparent md:bg-white md:rounded-xl md:shadow-[0_2px_15px_rgba(0,0,0,0.02)] md:border md:border-[#F0F0F0]/50 flex flex-col items-start md:items-center text-left md:text-center justify-center relative overflow-hidden group transition-all duration-700 border-b border-[#DEDEDE] md:border-b-0 pb-8 md:pb-0 mb-8 md:mb-0 last:border-b-0 last:mb-0 last:pb-0">
      <div className="flex flex-row md:flex-col items-center mb-3 md:mb-4 w-full">
          <div
            className={`mr-4 md:mr-0 p-3 md:p-3 rounded-full bg-white shadow-sm ${color} group-hover:scale-105 transition-transform duration-500`}
          >
            {icon}
          </div>
          <h5 className="text-[18px] md:text-xl font-bold md:font-medium tracking-[0.05em] md:tracking-[0.1em] text-[#111111] md:text-[#333333] font-serif leading-tight">
            {label}
          </h5>
      </div>
      <p className="text-[15px] md:text-base font-normal text-[#333333] md:text-[#666666] leading-relaxed tracking-normal font-sans pl-0 md:px-2 w-full">
        {desc}
      </p>
    </div>
  );
};

// --- Helper Components ---

const Section = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full"
      >
        {children}
      </motion.div>
    </section>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => {
  return (
    <div className="flex flex-col items-center md:items-center text-center p-0 md:p-6 bg-transparent transition-all duration-700 group cursor-default">
      <div className="mb-4 md:mb-6 p-4 md:p-5 bg-white shadow-sm md:bg-white/40 rounded-full group-hover:bg-white/80 transition-colors duration-500">
        {icon}
      </div>
      <h4 className="text-[18px] md:text-xl font-bold md:font-medium tracking-[0.1em] md:tracking-[0.15em] text-[#111111] md:text-[#333333] mb-3 md:mb-4 font-serif">
        {title}
      </h4>
      <p className="text-[15px] md:text-base font-normal text-[#333333] md:text-[#666666] leading-relaxed tracking-normal group-hover:text-[#111111] md:group-hover:text-[#444444] transition-colors duration-500 font-sans">
        {desc}
      </p>
    </div>
  );
};

