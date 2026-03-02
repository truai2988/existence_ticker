import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  animate,
  AnimatePresence,
} from "framer-motion";
import { ArrowDown, Sparkles, Send } from "lucide-react";
import { useAuth } from "../hooks/useAuthHook";
import { GoyenShimmer } from "../components/GoyenShimmer";

export const LandingPage = () => {
  const navigate = useNavigate();

  // Redirect PWA standalone immediately to /app
  useEffect(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ('standalone' in window.navigator && (window.navigator as any).standalone);
      
    if (isStandalone) {
      navigate('/app', { replace: true });
    }
  }, [navigate]);

  // --- A-Side: Ten-Day Lapse (Pure Abundance) ---
  const [lumens, setLumens] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const { user } = useAuth();

  const SCENES = [
    {
      image: "/scene-1000.webp",
      text: "人生の節目を、誰かの手とともに越える。最大の敬意（1,000 Lm）を込めて。",
      id: 1000,
    },
    {
      image: "/scene-500.webp",
      text: "独りでは届かなかった場所に、誰かの手が届く。日常への感謝（500 Lm）を添えて。",
      id: 500,
    },
    {
      image: "/scene-0.webp",
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

    // Stage 2: Real-time Flow (45 minutes = 7.5 Lm flows to the world)
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
      className="bg-[#F9F8F4] min-h-screen text-[#2D2D2D] font-sans selection:bg-orange-100 selection:text-[#2D2D2D] overflow-x-hidden relative antialiased"
    >
      {/* --- Header / Navigation --- */}
      <nav className="absolute top-0 left-0 right-0 z-[100] px-6 py-8 flex justify-center items-center mix-blend-difference pointer-events-none">
        <div className="flex items-center gap-6 pointer-events-auto">
          <span className="text-xs md:text-base font-bold tracking-[0.4em] uppercase text-white/90 select-none">
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
            className="text-xs md:text-base font-normal tracking-[0.1em] text-white/60 hover:text-white transition-colors border-l border-white/20 pl-4 md:pl-6 block"
          >
            招待コードをお持ちの方
          </a>
        </div>
      </nav>

      {/* --- Ambient: Daybreak Noise & The Tide --- */}
      <GoyenShimmer zIndex={50} />
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] transform-gpu"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
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
      <section className="min-h-screen md:min-h-screen flex flex-col items-center justify-center sticky top-0 z-10 overflow-hidden bg-[#F9F8F4] pt-16 md:pt-20">
        <motion.div
          style={{ opacity: opacityHero, scale: scaleHero }}
          className="flex flex-col items-center text-center px-4 relative w-full py-8"
        >
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
                className="relative flex items-baseline pb-2 md:pb-4"
              >
                {/* 整数部分（中央揃えの基準） */}
                <span
                  className="font-bold tabular-nums bg-gradient-to-b from-[#111111] via-[#4A4A4A] to-[#6B5A4F] bg-clip-text text-transparent pb-4 md:pb-8 leading-tight"
                  style={{ fontSize: "clamp(2.5rem, 16vw, 160px)" }}
                >
                  {bigPart}
                </span>

                {/* 小数部分＋Lm を整数の右に絶対配置 */}
                <div className="absolute left-full bottom-0 flex items-baseline pb-2 md:pb-4">
                  <span
                    className="font-medium tabular-nums ml-1 bg-gradient-to-b from-[#111111] via-[#4A4A4A] to-[#6B5A4F] bg-clip-text text-transparent opacity-90 leading-tight"
                    style={{ fontSize: "clamp(0.9rem, 5.3vw, 50px)" }}
                  >
                    .{smallPart}
                  </span>
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
              </motion.div>
            </div>
          </div>

          <div className="space-y-8 md:space-y-12 max-w-3xl mx-auto mb-10 md:mb-24">
            <div className="space-y-2">
              <p className="text-base md:text-lg leading-relaxed md:leading-[2.2] tracking-wide font-serif text-[#1A1A1A] md:text-[#2D2D2D]">
                減ることは、失うことではありません。それは、深呼吸（代謝）です。
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm md:text-base leading-relaxed md:leading-[2.2] tracking-wide font-serif text-[#444444]">
                ずっと貯め込まなければならないなんて、苦しいはずです。
                <br className="hidden md:block" />
                水が流れるように、息を吐いて吸うように。
                <br className="hidden md:block" />
                本当の価値とは、留まることのない「循環」の中に宿ります。
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm md:text-base leading-relaxed md:leading-[2.2] tracking-wide font-serif text-[#444444]">
                私たちが作ったのは、時間が経つと消えてしまう
                <span className="text-[#8B6B50] font-medium px-1">
                  源気（げんき）
                </span>
                です。
                <br className="hidden md:block" />
                でも、怖がらないでください。
                <br className="hidden md:block" />
                それは喪失ではなく、生きている証拠なのですから。
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-base md:text-lg leading-relaxed md:leading-[2.2] tracking-wide font-serif text-[#1A1A1A] md:text-[#2D2D2D] font-medium md:font-normal">
                未来への不安（負債）を手放して、
                <br className="hidden md:block" />
                いま生きている鼓動（存在）を贈り合う。
                <br className="hidden md:block" />
                そんな、やさしい経済の形を始めませんか。
              </p>
            </div>
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
      <div className="relative z-20 bg-[#F9F8F4]/95 min-h-screen">
        {/* --- The Scenes --- */}
        <section className="py-16 md:py-32 space-y-32 md:space-y-48">
          {SCENES.map((scene) => (
            <motion.div
              key={scene.id}
              onViewportEnter={() => {
                if (scene.id === 0) {
                  window.dispatchEvent(new Event("goyen-celebration"));
                }
              }}
              viewport={{ amount: 0.4, once: false }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex flex-col items-center gap-10 md:gap-12 max-w-md mx-auto px-6"
            >
              {/* 画像：中央寄せ、十分な幅 */}
              <div className="w-full overflow-hidden rounded-sm shadow-[0_4px_30px_rgba(0,0,0,0.06)]">
                <img
                  src={scene.image}
                  alt={`Scene ${scene.id}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto mix-blend-multiply sepia-[0.15] grayscale-[0.1] contrast-[1.05] transition-transform duration-[2000ms] hover:scale-[1.03]"
                />
              </div>
              {/* テキスト：画像の下、中央揃え、十分な行間 */}
              <p className="text-base md:text-lg font-serif text-[#444444] leading-[2.4] tracking-[0.08em] text-center">
                {scene.text}
              </p>
            </motion.div>
          ))}
        </section>

        <Section className="py-24 md:py-32 flex flex-col items-center bg-[#F9F8F4]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-20 md:mb-32">
              <span className="text-[10px] md:text-sm tracking-[0.5em] text-[#AAAAAA] uppercase mb-8 block font-sans">
                The Journey
              </span>
              <h3 className="text-3xl md:text-5xl font-light tracking-[0.2em] md:tracking-[0.4em] text-[#2D2D2D] font-serif whitespace-nowrap mb-6">
                重機と万年筆
              </h3>
              <p className="text-[10px] md:text-xs tracking-[0.4em] text-[#AAAAAA] uppercase font-serif mb-16">
                Heavy Machinery and Fountain Pens
              </p>
              <div className="max-w-2xl mx-auto space-y-12">
                <p className="text-xl md:text-3xl font-serif text-[#1A1A1A] tracking-[0.3em] leading-relaxed">
                  なぜ、このインフラを作ったのか。
                </p>
                <p className="text-sm md:text-base text-[#666666] leading-loose font-serif tracking-widest">
                  重機（資本主義）の唸りが止まない深夜、
                  <br className="hidden md:block" />
                  筆を執った一人の開発者の記録。
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3500);
                    }}
                    className="group relative px-8 md:px-16 py-5 border border-[#CCCCCC] text-[#999999] transition-all duration-700 tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-xs uppercase font-serif overflow-hidden cursor-default"
                  >
                    <span className="relative z-10">
                      現在、推敲中
                      <br />
                      （COMING SOON）
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-16 pb-20">
              <div className="text-center space-y-4">
                <h4 className="text-sm md:text-base font-serif tracking-[0.3em] text-[#8B6B50] font-medium">
                  存在の鼓動（Existence Ticker）
                </h4>
                <p className="text-xs md:text-sm tracking-[0.2em] text-[#AAAAAA] uppercase font-sans">
                  ——新時代の価値循環に関する宣言文
                </p>
              </div>

              <div className="space-y-12 md:space-y-16 text-[#444444] font-serif leading-[2.2] md:leading-[2.6] tracking-widest text-justify">
                <p>
                  現代社会は、資本主義という名の巨大な重機に頼りすぎいています。この重機は「未来の先食い」を燃料とし、欠乏と競争を点火剤として爆発的な発展をもたらしてきました。しかし、重機は大地を穿つには適していても、人の心に安らぎを綴るにはあまりに無骨すぎます。蓄積こそが価値であるという信仰は、やがて富を澱ませ、失うことへの終わりのない恐怖を全人類に植え付けてしまいました。
                </p>
                <p>
                  本来、価値とは生命のように循環すべきものです。流れを止めた川が濁るように、死蔵される富は腐敗していきます。私たちが必要としているのは、価値を腐らせないための「減価（ディケイ）」の導入です。時間と共に消えゆくという健全な焦燥こそが、停滞した世界を流動化させ、他者への譲渡を促す駆動力となります。減価とは喪失ではなく、生きるための代謝なのです。
                </p>
                <p>
                  さらに、価値の源泉を「外側」から「内側」へと取り戻さなければなりません。既存のシステムが「負債」から始まるのに対し、私たちは「存在」から価値を定義します。生きているという物理現象、その鼓動（ティッカー）そのものを採掘（マイニング）の裏付けとするのです。誰かに養われるのではなく、ただ呼吸を続けるだけで、自らが価値の源泉＝中央銀行となります。この「存在の価値」への確信こそが、未来への生存本能的な恐怖を解除する唯一のプロトコルです。
                </p>
                <p>
                  私たちは資本主義を否定しません。開拓には重機の馬鹿力が必要です。ですが、質を重んじ、生の感触を確かめ合う局面では、そのエンジンを切り、万年筆を手に取る知恵を持つべきです。借金に追われるスリルとサスペンスの時代から、存在を肯定し合うヒューマンドラマの時代へ。二つの道具を使い分け、信頼と安らぎで呼吸する時間を取り戻しましょう。それが、私たちの提唱する「真の豊かさ」の設計図です。
                </p>
              </div>
            </div>
          </div>
        </Section>
        <Section className="py-20 md:py-32 pb-32 md:pb-32 flex flex-col items-center text-center px-6 bg-gradient-to-b from-transparent to-[#EBE9E4]/40">
          <div className="bg-white p-6 rounded-full mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] mx-auto w-fit">
            <Sparkles size={24} className="text-[#C5A065] stroke-[1px]" />
          </div>

          <h3 className="text-2xl md:text-3xl font-bold md:font-light tracking-[0.1em] md:tracking-[0.2em] text-[#111111] md:text-[#444444] mb-12 font-serif">
            Phase 2 (創世記)：30名の「守人」を募集します
          </h3>

          <div className="text-[#333333] md:text-[#555555] mb-16 font-medium md:font-normal tracking-wide text-base leading-relaxed max-w-2xl mx-auto font-serif space-y-6">
            <p>Existence Tickerは、単なるアプリの配布ではありません。</p>
            <p>
              私たちは今、資本主義の轟音を離れ、この「物語」を現実にする30名の守人（Steward）を探しています。
            </p>
            <p>
              一度に30人を集めることを急ぎません。
              <br className="hidden md:block" />
              たとえ一人ずつであっても、この哲学を共に磨き、「存在が価値になる」瞬間を共創できる同志と、静かに、深く、始めたいと考えています。
            </p>
          </div>

          <div className="mb-12 max-w-lg mx-auto text-center">
            <p className="text-xs tracking-[0.4em] text-[#AAAAAA] uppercase mb-6 italic font-serif">
              魂のフィルター
            </p>
            <div className="text-left bg-black/[0.01] p-6 md:p-8 rounded-2xl border border-black/[0.03] backdrop-blur-[2px]">
              <p className="text-sm font-semibold tracking-widest text-[#8B6B50] mb-4">
                【応募条件】
              </p>
              <ul className="text-xs md:text-sm text-[#666666] font-serif leading-loose tracking-widest space-y-3">
                <li className="flex gap-2 items-start">
                  <span className="text-[#8B6B50] mt-0.5">・</span>
                  <span>資本主義の計算（損得）を、一時的に手放せること。</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-[#8B6B50] mt-0.5">・</span>
                  <span>
                    あなたの「孤独」と「優しさ」を、このプロジェクトに貸してくれること。
                  </span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-[#8B6B50] mt-0.5">・</span>
                  <span>
                    グッドデザイン賞等の挑戦を通じ、新しい時代の証人となる覚悟があること。
                  </span>
                </li>
              </ul>
            </div>
          </div>

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
                className="flex-1 bg-transparent z-10 px-8 py-6 md:py-5 text-[#2D2D2D] placeholder:text-[#888888] outline-none text-base tracking-[0.1em] font-serif"
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
          <div className="absolute bottom-8 left-0 right-0 text-center space-y-2">
            <p className="text-[10px] md:text-xs text-[#AAAAAA] tracking-[0.3em] uppercase font-serif">
              © 2026 EXISTENCE TICKER.
            </p>
            <p className="text-[10px] md:text-xs text-[#BBBBBB] tracking-[0.15em] font-serif">
              庭師（開発・運営）：玉置士朗 / 合同会社カイシュウ
            </p>
            <p className="text-[10px] md:text-xs text-[#BBBBBB] tracking-[0.15em] font-serif">
              URL：{" "}
              <a
                href="https://yori-somaru.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[#8B6B50] transition-colors duration-300"
              >
                https://yori-somaru.com/
              </a>
            </p>
            <p className="text-[10px] md:text-xs text-[#BBBBBB] tracking-[0.15em] font-serif">
              お問い合わせ：trueeye792@gmail.com
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

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed bottom-8 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[200] px-6 md:px-8 py-4 bg-white/95 backdrop-blur-sm border border-[#E5E0D5] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:max-w-md md:mx-auto"
          >
            <p className="text-sm md:text-base text-[#666666] font-serif tracking-wide text-center leading-relaxed">
              現在、最終調整を行っています。 まもなく公開されます。
            </p>
          </motion.div>
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
  return (
    <section className={className} id={id}>
      <div className="w-full">{children}</div>
    </section>
  );
};
