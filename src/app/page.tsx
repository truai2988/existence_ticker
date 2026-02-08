import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, animate } from 'framer-motion';
import { ArrowDown, Droplets, HeartHandshake, Sparkles, Send, Sun, Heart, Smile, Users } from 'lucide-react';

export const LandingPage = () => {
  // --- A-Side: Ten-Day Lapse (Pure Abundance) ---
  const [lumens, setLumens] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  
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
      <section className="h-screen flex flex-col items-center justify-center sticky top-0 z-10">
        <motion.div 
          style={{ opacity: opacityHero, scale: scaleHero }}
          className="flex flex-col items-center text-center px-4 relative w-full"
        >
            <div className="mb-20 space-y-6">
                <h1 className="text-sm md:text-base font-medium tracking-[0.4em] text-[#888888] uppercase font-serif">
                    Existence Ticker
                </h1>
            </div>

            {/* The Massive Vessel of Light */}
            <div className="relative group cursor-default mb-16">
                {/* Core Amber Glow (Bloom) */}
                <motion.div 
                    animate={{ opacity: [0.3, 0.5, 0.3], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-amber-200/20 blur-[100px] rounded-full mix-blend-multiply"
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
                            className="flex items-baseline pb-4"
                        >
                            <span className="text-[12vmin] font-normal tabular-nums bg-gradient-to-b from-[#4A4A4A] via-[#6B5A4F] to-[#8B7E74] bg-clip-text text-transparent pb-8 leading-tight">
                                {bigPart}
                            </span>
                            <span className="text-[5vmin] font-normal tabular-nums ml-1 bg-gradient-to-b from-[#4A4A4A] via-[#6B5A4F] to-[#8B7E74] bg-clip-text text-transparent opacity-90 pb-4 leading-tight">
                                .{smallPart}
                            </span>
                        </motion.div>
                    
                    {/* Living Unit: Lm */}
                    <motion.span 
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="text-[2vmin] font-light text-[#A89F91] ml-4 mb-4 italic tracking-widest"
                    >
                        Lm
                    </motion.span>
                </div>
            </div>

            {/* The Message: Soul Translation */}
            <div className="space-y-6 max-w-lg mx-auto">
                <p className="text-base md:text-lg font-normal tracking-[0.08em] text-[#555555] leading-loose font-serif">
                    この光（Lm：ルーメン）は、あなたが生きている証。
                </p>
                <div className="h-[1px] w-8 bg-[#DDDDDD] mx-auto opacity-50"></div>
                <p className="text-base md:text-lg font-normal tracking-[0.05em] text-[#666666] leading-loose font-serif">
                    握りしめなくても大丈夫。<br/>
                    あなたがただ、ここにいるだけで、<br/>
                    <span className="text-[#9C7C60]">新しい光は、また必ず満たされるから。</span>
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
        
        {/* Story of Flow (Infrastructure Story) */}
        <Section className="py-60 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
            <div className="space-y-16 font-serif text-[#444444]">
                <p className="text-lg md:text-xl leading-[3] tracking-wider">
                    あなたの器から溢れ出した光は、<br className="hidden md:block" />
                    誰かの暗闇を照らす灯火（ともしび）になります。
                </p>
                <p className="text-lg md:text-xl leading-[3] tracking-wider">
                    これは、奪い合うための通貨ではありません。<br className="hidden md:block" />
                    <span className="text-[#9C7C60] font-medium">生きていくことを、みんなで支え合うための『互助インフラ』</span>です。
                </p>
            </div>
        </Section>

        {/* Q&A Section */}
        <Section className="py-64 flex flex-col items-center text-center px-6">
            <h2 className="text-2xl md:text-3xl font-normal leading-[2.5] tracking-wider mb-20 max-w-3xl mx-auto text-[#2D2D2D] font-serif">
                なぜ、私たちの価値は<br/>
                <span className="text-[#9C7C60] inline-block bg-amber-50/70 rounded-lg px-2 py-0.5 shadow-[0_2px_10px_rgba(255,191,0,0.05)]">「何かをした対価」</span>でしか<br/>
                測られないのか？
            </h2>
            <p className="text-lg md:text-xl font-normal text-[#666666] leading-[3] max-w-2xl mx-auto tracking-wider font-serif">
                この場所では、ただ生きていることが価値となる。<br/>
                その価値は、あなたの器を通り抜け、<br/>
                優しく、世界へと還っていく。
            </p>
        </Section>

        {/* The 3 Laws (Rebranded + Mutual Aid Refinement) */}
        <Section className="py-48 px-6 max-w-6xl mx-auto w-full">
            <div className="grid md:grid-cols-3 gap-16 md:gap-12">
                <FeatureCard 
                    icon={<Sun size={28} className="text-orange-300 stroke-[1.5px]" />}
                    title="満たし (Blessing)"
                    desc="十日に一度、あなたの器は 2,400 Lm の光で満たされます。"
                />
                <FeatureCard 
                    icon={<Droplets size={28} className="text-blue-300 stroke-[1.5px]" />}
                    title="巡り (Flow)"
                    desc="一時間ごとに 10 Lm が、社会という海へ還っていきます。"
                />
                <FeatureCard 
                    icon={<HeartHandshake size={28} className="text-rose-300 stroke-[1.5px]" />}
                    title="結び (Connection)"
                    desc="誰かに手渡すことでしか、この光は守れない。具体的に誰かに託すとき、ギフトとしての温もりが生まれます。"
                />
            </div>
        </Section>

        {/* Scenarios of Mutual Aid (Shiori Cards) */}
        <Section className="py-60 px-6 bg-gradient-to-b from-transparent via-white/30 to-transparent">
             <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10 mb-24">
                <ScenarioCard 
                    icon={<Smile size={24} />}
                    label="100 Lm：軽い手助け"
                    desc="「ちょっと助かったよ」というお礼に。スマホの操作や、重い荷物運び、日常の「ありがとう」を光に託します。"
                    color="text-orange-300"
                />
                <ScenarioCard 
                    icon={<Users size={24} />}
                    label="500 Lm：しっかりした仕事"
                    desc="約2日分のエネルギーを贈る、まとまった感謝に。草むしりや片付け、趣味の相談など、相手の時間を大切に受け取ったときに。"
                    color="text-blue-300"
                />
                <ScenarioCard 
                    icon={<Heart size={24} />}
                    label="1,000 Lm：深い献身"
                    desc="約4日分の生命力を託す、最大級の信頼。専門的な支えや、数日にわたる見守りなど、人生の節目を助け合うための光です。"
                    color="text-rose-300"
                />
             </div>
             <p className="text-center text-sm md:text-base text-[#888888] tracking-[0.2em] font-serif opacity-70 italic leading-relaxed">
                あなたの器（2,400 Lm）から溢れる光を、自由な感性で巡らせてください。
             </p>
        </Section>


        {/* --- C-Side: Waitlist Section --- */}
        <Section className="py-40 flex flex-col items-center text-center px-6 bg-gradient-to-b from-transparent to-[#EBE9E4]/40">
            <div className="bg-white p-6 rounded-full mb-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)] mx-auto w-fit">
                <Sparkles size={24} className="text-[#C5A065] stroke-[1px]" />
            </div>
            
            <h3 className="text-xl font-medium tracking-[0.2em] text-[#444444] mb-8 uppercase font-serif">
                Phase 2: Invite Only
            </h3>
            <p className="text-[#777777] mb-16 font-normal tracking-widest text-sm leading-relaxed max-w-lg mx-auto font-sans">
                30名の仲間と共に、新しい支え合いの形を実験しています。<br/>
                現在は招待制での運用準備中です。
            </p>

            <form className="w-full max-w-2xl mx-auto group/form relative" onSubmit={(e) => e.preventDefault()}>
                <div className="relative flex flex-col sm:flex-row items-stretch bg-white rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.02)] p-2 transition-all duration-700 hover:shadow-[inset_0_2px_15px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.04)] border border-orange-100/20">
                    <input 
                        type="email" 
                        placeholder="your@email.com" 
                        className="flex-1 bg-transparent px-8 py-5 text-[#2D2D2D] placeholder:text-[#CCCCCC] outline-none text-base tracking-[0.1em] font-serif"
                    />
                    <button className="group relative px-10 py-5 rounded-xl bg-[#2D2D2D] text-white text-xs font-bold tracking-[0.2em] overflow-hidden transition-all hover:bg-black">
                        <span className="relative z-10 flex items-center justify-center gap-4">
                            ご縁を結ぶ（Waitlistに登録） <Send size={14} className="group-hover:translate-x-1 transition-transform stroke-[1.5px]" />
                        </span>
                        
                        {/* Golden Glow: Heat of life warmth */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-200/10 to-amber-400/0 opacity-0 group-hover:opacity-100 group-hover:translate-x-[100%] transition-all duration-1000 ease-in-out"></div>
                    </button>
                </div>
            </form>
        </Section>

        {/* Footer */}
        <footer className="py-20 text-center border-t border-[#EAEAEA]">
            <div className="mb-12">
                <Link 
                  to="/app" 
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
                </Link>
            </div>
            <p className="text-[10px] text-[#AAAAAA] tracking-[0.2em] uppercase font-serif">
                © 2026 Existence Ticker.
            </p>
        </footer>

      </div>
    </div>
  );
};

// --- Helper Components ---

const ScenarioCard = ({ icon, label, desc, color }: { icon: React.ReactNode, label: string, desc: string, color: string }) => {
    return (
        <div className="p-10 pb-14 bg-white rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.02)] border-l border-orange-100/30 flex flex-col items-start text-left relative overflow-hidden group hover:shadow-[0_30px_60px_rgba(0,0,0,0.04)] transition-all duration-700">
            <div className={`mb-10 p-3 rounded-full bg-white shadow-sm ${color} group-hover:scale-110 transition-transform duration-500`}>
                {icon}
            </div>
            <h5 className="text-base font-medium tracking-[0.2em] text-[#444444] mb-8 font-serif border-b border-[#F0F0F0] pb-4 w-full">
                {label}
            </h5>
            <p className="text-base font-normal text-[#666666] leading-[2.2] tracking-wider font-serif">
                {desc}
            </p>
            {/* Shiori/Bookmark feel: Small ribbon element */}
            <div className="absolute top-0 right-4 h-10 w-[1px] bg-orange-100/30"></div>
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
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="w-full"
            >
                {children}
            </motion.div>
        </section>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => {
    return (
        <div className="flex flex-col items-center text-center p-6 bg-transparent transition-all duration-700 group cursor-default">
            <div className="mb-10 p-5 bg-white/50 rounded-full group-hover:bg-white transition-colors duration-500 shadow-sm">
                {icon}
            </div>
            <h4 className="text-lg md:text-xl font-medium tracking-widest text-[#444444] mb-8 font-serif">{title}</h4>
            <p className="text-base font-normal text-[#777777] leading-[2.2] tracking-wider group-hover:text-[#555555] transition-colors duration-500 font-serif">
                {desc}
            </p>
        </div>
    );
};

