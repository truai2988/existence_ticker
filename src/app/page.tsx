import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  animate,
  AnimatePresence,
} from "framer-motion";
import { ArrowDown, Sparkles, Send } from "lucide-react";
import { CHAPTERS } from "../data/storyData";
import { useAuth } from "../hooks/useAuthHook";

export const LandingPage = () => {
  // --- A-Side: Ten-Day Lapse (Pure Abundance) ---
  const [lumens, setLumens] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const SCENES = [
    {
      image: "/scene-1000.png",
      text: "人生の節目を、誰かの手とともに越える。最大の敬意（1,000 Lm）を込めて。",
      id: 1000,
    },
    {
      image: "/scene-500.png",
      text: "独りでは届かなかった場所に、誰かの手が届く。日常への感謝（500 Lm）を添えて。",
      id: 500,
    },
    {
      image: "/scene-0.png",
      text: "ただ共に在る。生きていることを祝う、純粋な共鳴（0 Lm / ∞）。",
      id: 0,
    },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setInviteCode(code);
    }
  }, []);

  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    // Allow animation to finish before navigating
    setTimeout(() => {
      if (inviteCode && !user) {
        navigate(`/app?code=${inviteCode}`);
      } else {
        navigate("/app");
      }
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
      },
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
      setLumens((prev) => {
        const next = prev - DECAY_PER_10MS;
        return next > 0 ? next : 0;
      });
    }, 10);

    return () => clearInterval(interval);
  }, [isInitialized]);

  const formattedLumens = lumens.toFixed(2);
  const [bigPart, smallPart] = formattedLumens.split(".");

  // --- Scroll Animations ---
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scaleHero = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div
      ref={containerRef}
      className="bg-[#F9F8F4] min-h-screen text-[#2D2D2D] font-sans selection:bg-orange-100 selection:text-[#2D2D2D] overflow-x-hidden relative"
    >
      {/* --- Sticky Header / Navigation --- */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-8 flex justify-between items-center mix-blend-difference pointer-events-none">
        <div className="flex items-center gap-6 pointer-events-auto">
          <span className="text-xs font-bold tracking-[0.4em] uppercase text-white/90 select-none">
            Existence Ticker
          </span>
          <a
            href="#entrance"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("entrance")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-[9px] min-[375px]:text-[10px] md:text-xs font-medium tracking-[0.1em] text-white/60 hover:text-white transition-colors border-l border-white/20 pl-4 md:pl-6 block"
          >
            招待コードをお持ちの方
          </a>
        </div>
      </nav>

      {/* --- Ambient: Daybreak Noise & The Tide --- */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* The Tide Animation (Ripples of Light) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border border-orange-100/30 rounded-full"
            initial={{ width: "0%", height: "0%", opacity: 0.8 }}
            animate={{ width: "150vw", height: "150vw", opacity: 0 }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 5,
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
            scale: [0.8, 1.2, 1.5],
          }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          onAnimationComplete={() => setShowFlash(false)}
          className="fixed inset-0 z-[100] bg-gradient-to-r from-orange-200/50 via-white/80 to-orange-200/50 pointer-events-none mix-blend-screen overflow-hidden"
        />
      )}

      {/* --- A-Side: The Amber Core (Hero Section) --- */}
      <section className="min-h-screen md:min-h-screen flex flex-col items-center justify-center sticky top-0 z-10 overflow-hidden bg-[#F9F8F4]">
        <motion.div
          style={{ opacity: opacityHero, scale: scaleHero }}
          className="flex flex-col items-center text-center px-4 relative w-full pt-20 md:pt-24 pb-12"
        >
          <div className="mb-4 md:mb-20 space-y-4 md:space-y-6">
            <h1 className="text-base font-medium md:font-light tracking-[0.3em] md:tracking-[0.4em] text-[#444444] md:text-[#555555] uppercase font-serif">
              重機を降りて、存在を祝うインフラへ。
            </h1>
            <p className="text-xs font-light tracking-[0.2em] text-[#999999] uppercase font-serif">
              Heavy machinery for the earth, this infrastructure for the soul.
            </p>
          </div>

          {/* The Massive Vessel of Light */}
          <div className="relative group cursor-default mb-6 md:mb-16">
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
                    "0 0 30px rgba(255,190,100,0.05)",
                  ],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex items-baseline pb-2 md:pb-4"
              >
                <span className="text-8xl md:text-[160px] font-bold tabular-nums bg-gradient-to-b from-[#111111] via-[#4A4A4A] to-[#6B5A4F] bg-clip-text text-transparent pb-4 md:pb-8 leading-tight">
                  {bigPart}
                </span>
                <span className="text-3xl md:text-[50px] font-medium tabular-nums ml-1 bg-gradient-to-b from-[#111111] via-[#4A4A4A] to-[#6B5A4F] bg-clip-text text-transparent opacity-90 pb-2 md:pb-4 leading-tight">
                  .{smallPart}
                </span>
              </motion.div>

              {/* Living Unit: Lm */}
              <motion.span
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="text-xs md:text-base font-medium md:font-light text-[#6A5F51] md:text-[#A89F91] ml-2 md:ml-4 mb-2 md:mb-4 italic tracking-widest font-sans"
              >
                Lm
              </motion.span>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl mx-auto mb-4 md:mb-20">
            <p className="text-base leading-relaxed md:leading-[2.2] tracking-wide font-serif text-[#222222] md:text-[#444444]">
              私たちは「豊かさ」という名の重機を動かし、大地を拓き、文明を築きました。
              <br className="hidden md:block" />
              しかし、その轟音の中で「ただ、そこにいること」の安らぎを
              <br className="hidden md:block" />
              忘れてしまったのではないでしょうか。
            </p>
            <div className="h-[1px] w-12 bg-[#8B6B50]/30 mx-auto my-8"></div>
            <p className="text-base leading-relaxed md:leading-[2.2] tracking-wide font-serif text-[#222222] md:text-[#444444]">
              ET（Existence Ticker）は、新しい通貨ではありません。
              <br className="hidden md:block" />
              借金や利息に追い立てられる「重力」からあなたを解放し、
              <br className="hidden md:block" />
              呼吸するように感謝を巡らせるための、静かな
              <span className="text-[#8B6B50] md:text-[#9C7C60] font-bold md:font-medium text-base">
                「生命のインフラ」
              </span>
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
        {/* --- The Scenes --- */}
        <section className="py-20 md:py-48 space-y-40 md:space-y-72">
          {SCENES.map((scene, index) => (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`flex flex-col ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-10 md:gap-16 max-w-4xl mx-auto px-8`}
            >
              <div className="w-full md:w-3/5 overflow-hidden rounded-sm">
                <motion.img
                  src={scene.image}
                  alt={`Scene ${scene.id}`}
                  className="w-full h-auto mix-blend-multiply sepia-[0.2] grayscale-[0.1] contrast-[1.05] transition-transform duration-[2000ms] hover:scale-105"
                />
              </div>
              <div className="w-full md:w-2/5 text-center md:text-left">
                <p className="text-lg md:text-2xl font-serif text-[#333333] leading-[1.9] tracking-normal md:tracking-[0.1em]">
                  {scene.text}
                </p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* --- C-Side: The Journey (Story Fragments) --- */}
        <Section className="py-40 flex flex-col items-center bg-[#F9F8F4] overflow-hidden">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-32">
              <span className="text-xs tracking-[0.4em] text-[#AAAAAA] uppercase mb-4 block font-sans">
                The Journey
              </span>
              <h3 className="text-3xl font-light tracking-[0.2em] text-[#2D2D2D] font-serif">
                アンチ・グラビティ
              </h3>
              <p className="text-xs tracking-[0.3em] text-[#AAAAAA] mt-4 uppercase font-serif">
                Heavy Machinery and Fountain Pens
              </p>
              <div className="mt-16 max-w-lg mx-auto">
                <p className="text-base text-[#666666] leading-relaxed font-serif tracking-widest text-justify md:text-center">
                  このインフラはいかにして産声を上げたのか。
                  <br className="hidden md:block" />
                  重機（資本主義）の唸りが止まない深夜、筆を執った一人の開発者の記録。
                </p>
              </div>
            </div>

            <div className="space-y-40 md:space-y-64 mb-32">
              {CHAPTERS.filter((c) => c.id % 2 !== 0).map((chapter) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{ duration: 1.2 }}
                  className="flex flex-col items-center text-center max-w-2xl mx-auto"
                >
                  <span className="text-[10px] md:text-xs tracking-[0.3em] text-[#BBBBBB] mb-8 font-sans">
                    Chapter {chapter.id.toString().padStart(2, "0")}
                  </span>
                  <blockquote className="text-base md:text-3xl font-serif italic text-[#444444] leading-[2.2] md:leading-relaxed mb-6 tracking-widest px-4">
                    「{chapter.fragment}」
                  </blockquote>
                  <div className="h-[1px] w-8 bg-[#E5E0D5]" />
                </motion.div>
              ))}
            </div>

            <div className="h-[20vh]"></div>
          </div>
        </Section>

        {/* --- Story CTA --- */}
        <Section className="py-32 md:py-48 flex flex-col items-center bg-[#F9F8F4]">
          <div className="text-center space-y-12 border-t border-b border-slate-300/40 py-16 px-8">
            <p className="text-2xl md:text-3xl font-serif text-[#1A1A1A] tracking-[0.4em] mb-8">
              なぜ、このインフラを作ったのか。
            </p>
            <button
              onClick={() => window.open("/story", "_blank")}
              className="group relative px-16 py-5 border border-[#2D2D2D]/30 text-[#2D2D2D]/60 hover:text-[#2D2D2D] hover:border-[#2D2D2D] transition-all duration-700 tracking-[0.5em] text-xs uppercase font-serif overflow-hidden"
            >
              <span className="relative z-10">原典（Story）を読む</span>
              <div className="absolute inset-0 bg-[#2D2D2D]/[0.02] translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </button>
          </div>
        </Section>
        <Section className="py-24 md:py-40 pb-48 md:pb-40 flex flex-col items-center text-center px-6 bg-gradient-to-b from-transparent to-[#EBE9E4]/40">
          <div className="bg-white p-6 rounded-full mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] mx-auto w-fit">
            <Sparkles size={24} className="text-[#C5A065] stroke-[1px]" />
          </div>

          <h3 className="text-3xl font-bold md:font-light tracking-[0.1em] md:tracking-[0.3em] text-[#111111] md:text-[#444444] mb-8 uppercase font-serif">
            Phase 2: Invite Only
          </h3>
          <p className="text-[#333333] md:text-[#555555] mb-12 font-medium md:font-normal tracking-wide text-base leading-relaxed max-w-lg mx-auto font-sans">
            30名の仲間と共に、新しい支え合いの形を実験しています。
            <br />
            現在は静かに招待制での運用準備中です。
          </p>

          <form
            className="w-full max-w-2xl mx-auto group/form relative"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="relative flex flex-col sm:flex-row items-stretch bg-[#FDFDFB] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.02)] p-2.5 transition-all duration-700 hover:shadow-[0_40px_80px_rgba(0,0,0,0.06),0_1px_6px_rgba(0,0,0,0.03)] border border-[#E5E0D5]">
              {/* Washi texture for form */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-2xl overflow-hidden"
                style={{
                  backgroundImage:
                    'url("https://www.transparenttextures.com/patterns/handmade-paper.png")',
                }}
              ></div>

              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-transparent z-10 px-8 py-6 md:py-5 text-[#2D2D2D] placeholder:text-[#BBBBBB] outline-none text-base tracking-[0.1em] font-serif"
              />
              <button className="group relative z-10 px-10 py-6 md:py-5 rounded-xl bg-[#2D2D2D] text-white text-base md:text-xs font-medium tracking-[0.25em] overflow-hidden transition-all hover:bg-[#111111] shadow-lg shadow-black/5 active:scale-[0.98] font-sans">
                <span className="relative z-10 flex items-center justify-center gap-4">
                  ご縁を結ぶ{" "}
                  <Send className="w-[18px] h-[18px] md:w-[15px] md:h-[15px] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform stroke-[1.5px]" />
                </span>

                {/* Elegant Shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
              </button>
            </div>
          </form>
        </Section>

        {/* --- Entrance Section --- */}
        <Section
          id="entrance"
          className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F9F8F4] relative border-t border-[#EAEAEA]"
        >
          <div className="flex flex-col items-center flex-grow justify-center">
            <button
              onClick={handleNavigate}
              className="group relative inline-block px-14 py-6 bg-gradient-to-b from-[#FFFFFF] to-[#FDFDFB] border border-[#E0DCD0] shadow-[0_4px_20px_rgba(139,107,80,0.05),0_1px_3px_rgba(0,0,0,0.02)] rounded-2xl hover:shadow-[0_8px_30px_rgba(139,107,80,0.1),0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#D0C8B8] transition-all duration-700 tracking-[0.2em] text-xs uppercase text-[#6B5A4F] hover:text-[#2D2D2D] overflow-hidden font-sans"
            >
              <span className="relative z-10 font-medium tracking-[0.4em] px-2">
                {user
                  ? "扉を開け、中へ"
                  : inviteCode
                    ? "招待を受け、扉を開ける"
                    : "扉を開く"}
              </span>

              {/* Mizuhiki / Red Thread Animation */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                <motion.svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 200 60"
                  preserveAspectRatio="none"
                >
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

              {/* Subtle inner glow on hover */}
              <div className="absolute inset-0 border border-white/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-overlay"></div>

              {/* Porcelain Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
            </button>
          </div>
          <div className="absolute bottom-12 left-0 right-0 text-center">
            <p className="text-[10px] md:text-xs text-[#AAAAAA] tracking-[0.3em] uppercase font-serif">
              © 2026 EXISTENCE TICKER.
            </p>
          </div>
        </Section>
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

// Helper Component
const Section = ({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section ref={ref} className={className} id={id}>
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
