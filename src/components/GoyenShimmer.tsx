import React, { useEffect, useRef } from "react";

interface GoyenShimmerProps {
  zIndex?: number;
}

export const GoyenShimmer: React.FC<GoyenShimmerProps> = ({ zIndex = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // 少しだけ彩度を残したパステルカラー（白背景で「汚れ（グレー）」に見えないように純度を上げる）
    const COLORS = [
      "255, 160, 160", // 桜 (少しピンクみ)
      "130, 200, 255", // 水 (少し青み)
      "160, 240, 140", // 若草 (少し緑み)
      "190, 160, 255", // 藤 (少し紫み)
    ];

    interface Particle {
      x: number;
      y: number;
      length: number;
      thickness: number;
      color: string;
      baseOpacity: number;
      opacity: number;
      targetOpacity: number;
      angle: number;
      vx: number;
      vy: number;
      va: number;
      pulsePhase: number;
      pulseSpeed: number;
      celebrationTimer: number;
    }

    const PARTICLE_COUNT = 30; // 20〜40本
    const particles: Particle[] = [];

    const createParticle = (): Particle => {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        length: 20 + Math.random() * 40, // 20px ~ 60px (繊細な長さに)
        thickness: 1.0 + Math.random() * 1.5, // 1.0px ~ 2.5px (太すぎないように戻す)
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        baseOpacity: 0.2 + Math.random() * 0.3, // 20% ~ 50% (彩度があるため、この程度の透明度で「淡い糸」になる)
        opacity: 0,
        targetOpacity: 0.2 + Math.random() * 0.3,
        angle: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.2, // 極めて遅い移動
        vy: (Math.random() - 0.5) * 0.2 - 0.1, // 全体的にわずかに上昇傾向
        va: (Math.random() - 0.5) * 0.005, // 極めて遅い回転
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        celebrationTimer: 0,
      };
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = createParticle();
        p.opacity = p.targetOpacity; // Initial state
        particles.push(p);
    }

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", resize);
    resize();

    // Scroll interaction
    let scrollY = window.scrollY;
    let lastScrollY = scrollY;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Celebration Event Listener
    const handleCelebration = () => {
      particles.forEach((p) => {
        p.celebrationTimer = 180; // 約3秒間の祝祭(60fps * 3)
        // 飛び散るような動きをすこし足す
        p.vx += (Math.random() - 0.5) * 1.5;
        p.vy += (Math.random() - 0.5) * 1.5 - 0.5;
        p.va += (Math.random() - 0.5) * 0.05;
      });
    };
    window.addEventListener("goyen-celebration", handleCelebration);

    const render = () => {
      // Clear canvas completely
      ctx.clearRect(0, 0, width, height);

      const deltaScroll = scrollY - lastScrollY;
      lastScrollY = scrollY;

      particles.forEach((p) => {
        // Move
        p.x += p.vx;
        p.y += p.vy - deltaScroll * 0.1; // スクロールに微かに反応（視差）
        p.angle += p.va;

        // Pulse opactiy
        p.pulsePhase += p.pulseSpeed;
        const currentPulse = Math.sin(p.pulsePhase) * 0.05;

        // Celebration logic
        let renderOpacity = p.baseOpacity + currentPulse;
        if (p.celebrationTimer > 0) {
           p.celebrationTimer--;
           // Burst effect (Max 0.5 opacity during celebration)
           const burst = (p.celebrationTimer / 180) * 0.4; 
           renderOpacity = Math.min(0.5, renderOpacity + burst);

           // 速度の減衰（空気抵抗）
           p.vx *= 0.98;
           p.vy *= 0.98;
           p.va *= 0.98;
           
           // ベースの速度に戻す力が働く
           if (Math.abs(p.vx) < 0.1) p.vx += (Math.random() - 0.5) * 0.02;
           if (Math.abs(p.vy) < 0.1) p.vy -= 0.01;
        } else {
            // Restore normal speed boundaries over time
            p.vx = p.vx * 0.99 + ((Math.random() - 0.5) * 0.2) * 0.01;
            p.vy = p.vy * 0.99 + ((Math.random() - 0.5) * 0.2 - 0.1) * 0.01;
            p.va = p.va * 0.99 + ((Math.random() - 0.5) * 0.005) * 0.01;
        }

        renderOpacity = Math.max(0, Math.min(1, renderOpacity));

        // Screen wrap
        if (p.x < -p.length) p.x = width + p.length;
        if (p.x > width + p.length) p.x = -p.length;
        if (p.y < -p.length) p.y = height + p.length;
        if (p.y > height + p.length) p.y = -p.length;

        // Draw Line Segment with fading edges
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        const gradient = ctx.createLinearGradient(-p.length / 2, 0, p.length / 2, 0);
        gradient.addColorStop(0, `rgba(${p.color}, 0)`);
        gradient.addColorStop(0.5, `rgba(${p.color}, ${renderOpacity})`);
        gradient.addColorStop(1, `rgba(${p.color}, 0)`);

        ctx.beginPath();
        ctx.moveTo(-p.length / 2, 0);
        ctx.lineTo(p.length / 2, 0);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = p.thickness;
        // Optional: lineCap = 'round' しても細いのでほとんど見えないが、一応。
        ctx.lineCap = "round";
        ctx.stroke();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("goyen-celebration", handleCelebration);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex }}
    />
  );
};
