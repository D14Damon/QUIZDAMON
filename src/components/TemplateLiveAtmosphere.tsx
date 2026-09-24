import React, { useEffect, useRef } from 'react';

export interface TemplateLiveAtmosphereProps {
  themeId?: string;
  themeName?: string;
  primaryColor?: string;
  backgroundColor?: string;
  isDark?: boolean;
  className?: string;
  interactive?: boolean;
  fixed?: boolean;
}

export const TemplateLiveAtmosphere: React.FC<TemplateLiveAtmosphereProps> = React.memo(({
  themeId = 'minimal-studio',
  themeName = '',
  primaryColor = '#18181b',
  backgroundColor,
  isDark = false,
  className = '',
  interactive = true,
  fixed = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: 0, targetY: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Normalize theme identifier
  const resolvedId = (themeId || '').toLowerCase();
  const isMinimal = resolvedId.includes('minimal') || resolvedId.includes('studio');
  const isEditorial = resolvedId.includes('editorial') || resolvedId.includes('paper') || themeName.toLowerCase().includes('gazette');
  const isBotanical = resolvedId.includes('botanical') || resolvedId.includes('sage');
  const isMidnight = resolvedId.includes('midnight') || resolvedId.includes('obsidian');
  const isTerracotta = resolvedId.includes('sunset') || resolvedId.includes('terracotta');
  const isCyber = resolvedId.includes('cyber') || resolvedId.includes('neon') || resolvedId.includes('horizon');
  const isLavender = resolvedId.includes('lavender') || resolvedId.includes('mist') || resolvedId.includes('dream');
  const isNeo = resolvedId.includes('neo') || resolvedId.includes('brutal');
  const isMonolith = resolvedId.includes('monolith') || resolvedId.includes('gold') || resolvedId.includes('luxury');
  const isCrimson = resolvedId.includes('crimson') || resolvedId.includes('scholar');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const handleResize = () => {
      if (!canvas) return;
      const parent = !fixed && canvas.parentElement ? canvas.parentElement : null;
      width = parent ? Math.max(parent.clientWidth, 100) : window.innerWidth;
      height = parent ? Math.max(parent.clientHeight, 100) : window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (!fixed && canvas.parentElement && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(canvas.parentElement);
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      mouseRef.current.targetX = (e.clientX / (width || 1) - 0.5) * 40;
      mouseRef.current.targetY = (e.clientY / (height || 1) - 0.5) * 40;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // Initialize effect-specific particle systems (lightweight, 20-35 items max)
    // 1. Botanical: Floating leaves & pollen spores
    const leaves = Array.from({ length: 18 }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      size: 14 + Math.random() * 16,
      vx: -0.3 + Math.random() * 0.6,
      vy: 0.4 + Math.random() * 0.7,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.02,
      wobbleSpeed: 0.015 + Math.random() * 0.02,
      wobbleOffset: Math.random() * Math.PI * 2,
      opacity: 0.25 + Math.random() * 0.4,
      hue: Math.random() > 0.5 ? '#2d6a4f' : '#52796f',
    }));

    const spores = Array.from({ length: 24 }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      radius: 1.5 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.3 - Math.random() * 0.4,
      pulse: Math.random() * Math.PI,
      pulseSpeed: 0.02 + Math.random() * 0.03,
      opacity: 0.3 + Math.random() * 0.5,
    }));

    // 2. Midnight Obsidian: Constellation network nodes
    const networkNodes = Array.from({ length: 28 }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: 1.8 + Math.random() * 2.2,
      glow: Math.random() * Math.PI * 2,
    }));

    const dataPackets = Array.from({ length: 6 }, () => ({
      fromIdx: Math.floor(Math.random() * 28),
      toIdx: Math.floor(Math.random() * 28),
      progress: Math.random(),
      speed: 0.008 + Math.random() * 0.012,
    }));

    // 3. Monolith Gold: 24k gold sparkling diamond stars & dust
    const goldParticles = Array.from({ length: 32 }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      size: 1.5 + Math.random() * 3.5,
      vx: -0.15 + Math.random() * 0.3,
      vy: -0.2 - Math.random() * 0.4,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.03 + Math.random() * 0.04,
      isFlare: Math.random() > 0.6,
      opacity: 0.2 + Math.random() * 0.6,
    }));

    // 4. Sunset Terracotta: Rising heat motes & golden fireflies
    const heatMotes = Array.from({ length: 26 }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      radius: 2 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.4 - Math.random() * 0.6,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.025 + Math.random() * 0.035,
      color: Math.random() > 0.4 ? '#f59e0b' : '#ea580c',
    }));

    // 5. Lavender Mist: Iridescent wellness bubbles
    const bubbles = Array.from({ length: 18 }, () => ({
      x: Math.random() * (width || 1200),
      y: height + Math.random() * 300,
      radius: 8 + Math.random() * 22,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.35 - Math.random() * 0.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.02,
      opacity: 0.25 + Math.random() * 0.35,
    }));

    // 6. Neo Brutalism: Kinetic geometric pop shapes
    const popShapes = Array.from({ length: 16 }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      size: 12 + Math.random() * 16,
      type: ['square', 'triangle', 'cross', 'circle'][Math.floor(Math.random() * 4)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.02,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.2 - Math.random() * 0.4,
      color: ['#000000', '#facc15', '#f43f5e', '#3b82f6'][Math.floor(Math.random() * 4)],
    }));

    // 7. Editorial Gazette: Dust motes & antique ink particles
    const inkSpecks = Array.from({ length: 28 }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      size: 1 + Math.random() * 2.5,
      vx: -0.2 + Math.random() * 0.4,
      vy: -0.15 - Math.random() * 0.3,
      opacity: 0.15 + Math.random() * 0.35,
      sway: Math.random() * Math.PI * 2,
    }));

    // 8. Crimson Scholar: Atomic orbits & glowing ruby sparks
    const rubySparks = Array.from({ length: 24 }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      radius: 1.5 + Math.random() * 2.8,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.3 - Math.random() * 0.5,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.03 + Math.random() * 0.04,
      glowColor: Math.random() > 0.5 ? '#ef4444' : '#991b1b',
    }));

    // 9. Cyber Horizon: Perspective Grid speed & sparks
    let gridOffset = 0;
    const cyberSparks = Array.from({ length: 20 }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      length: 10 + Math.random() * 25,
      speed: 1.5 + Math.random() * 2.5,
      opacity: 0.3 + Math.random() * 0.5,
      color: Math.random() > 0.5 ? '#06b6d4' : '#a855f7',
    }));

    // 10. Minimal Studio: Drafting coordinates & crosshairs
    const draftingCrosshairs = Array.from({ length: 8 }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      size: 10,
      opacity: 0.15 + Math.random() * 0.25,
    }));

    let lastTime = performance.now();
    let tick = 0;

    // Helper to draw a delicate leaf
    const drawLeaf = (x: number, y: number, size: number, rot: number, color: string, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.bezierCurveTo(size / 2.2, -size / 4, size / 2.2, size / 4, 0, size / 2);
      ctx.bezierCurveTo(-size / 2.2, size / 4, -size / 2.2, -size / 4, 0, -size / 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();

      // Leaf center stem
      ctx.beginPath();
      ctx.moveTo(0, -size / 2.2);
      ctx.lineTo(0, size / 2.2);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    };

    // Helper to draw diamond star flare
    const drawStarFlare = (x: number, y: number, r: number, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(0, -r * 2.8);
      ctx.quadraticCurveTo(0, 0, r * 2.8, 0);
      ctx.quadraticCurveTo(0, 0, 0, r * 2.8);
      ctx.quadraticCurveTo(0, 0, -r * 2.8, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r * 2.8);
      ctx.fill();

      // Center bright core
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    };

    // Main 60fps render loop
    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      tick += dt;

      // Mouse smooth interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.clearRect(0, 0, width, height);

      // ==========================================
      // 1. BOTANICAL SAGE: Realistic Falling Leaves & Pollen
      // ==========================================
      if (isBotanical) {
        // Dappled ambient sunbeam
        const sunX = width * 0.85;
        const grad = ctx.createRadialGradient(sunX, 0, 20, sunX, 0, height * 0.9);
        grad.addColorStop(0, 'rgba(216, 243, 220, 0.35)');
        grad.addColorStop(0.5, 'rgba(216, 243, 220, 0.12)');
        grad.addColorStop(1, 'rgba(216, 243, 220, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Falling leaves
        leaves.forEach((l) => {
          l.y += l.vy * 60 * dt;
          l.x += (l.vx + Math.sin(tick * l.wobbleSpeed + l.wobbleOffset) * 0.4) * 60 * dt;
          l.rotation += l.vRot;

          if (l.y > height + 40) {
            l.y = -30;
            l.x = Math.random() * width;
          }
          if (l.x < -30) l.x = width + 20;
          if (l.x > width + 30) l.x = -20;

          drawLeaf(l.x + mx * 0.4, l.y + my * 0.4, l.size, l.rotation, l.hue, l.opacity);
        });

        // Floating spores
        spores.forEach((s) => {
          s.y += s.vy * 60 * dt;
          s.x += s.vx * 60 * dt;
          s.pulse += s.pulseSpeed;

          if (s.y < -20) {
            s.y = height + 10;
            s.x = Math.random() * width;
          }

          const currentOpacity = s.opacity * (0.6 + 0.4 * Math.sin(s.pulse));
          ctx.beginPath();
          ctx.arc(s.x + mx * 0.2, s.y + my * 0.2, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(167, 201, 87, ${currentOpacity})`;
          ctx.fill();
        });
      }

      // ==========================================
      // 2. MIDNIGHT OBSIDIAN: Constellation Neural Tech
      // ==========================================
      else if (isMidnight) {
        // Deep space cosmic aurora
        const waveY = height * 0.4 + Math.sin(tick * 0.4) * 40;
        const aurora = ctx.createLinearGradient(0, waveY - 200, width, waveY + 200);
        aurora.addColorStop(0, 'rgba(99, 102, 241, 0.0)');
        aurora.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
        aurora.addColorStop(0.8, 'rgba(168, 85, 247, 0.05)');
        aurora.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
        ctx.fillStyle = aurora;
        ctx.fillRect(0, 0, width, height);

        // Update nodes
        networkNodes.forEach((node) => {
          node.x += node.vx * 60 * dt;
          node.y += node.vy * 60 * dt;
          node.glow += 0.03;

          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
        });

        // Connect nearby nodes
        const maxDist = 160;
        for (let i = 0; i < networkNodes.length; i++) {
          for (let j = i + 1; j < networkNodes.length; j++) {
            const dx = networkNodes[i].x - networkNodes[j].x;
            const dy = networkNodes[i].y - networkNodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
              const alpha = (1 - dist / maxDist) * 0.22;
              ctx.beginPath();
              ctx.moveTo(networkNodes[i].x + mx * 0.5, networkNodes[i].y + my * 0.5);
              ctx.lineTo(networkNodes[j].x + mx * 0.5, networkNodes[j].y + my * 0.5);
              ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }

        // Draw nodes & glowing cores
        networkNodes.forEach((node) => {
          const pulse = 0.5 + 0.5 * Math.sin(node.glow);
          ctx.beginPath();
          ctx.arc(node.x + mx * 0.5, node.y + my * 0.5, node.radius * (0.8 + 0.3 * pulse), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(99, 102, 241, ${0.4 + 0.4 * pulse})`;
          ctx.shadowColor = '#6366f1';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Data packets traveling across lines
        dataPackets.forEach((pkt) => {
          pkt.progress += pkt.speed * 60 * dt;
          if (pkt.progress >= 1) {
            pkt.progress = 0;
            pkt.fromIdx = pkt.toIdx;
            pkt.toIdx = Math.floor(Math.random() * networkNodes.length);
          }
          const from = networkNodes[pkt.fromIdx];
          const to = networkNodes[pkt.toIdx];
          if (from && to) {
            const px = from.x + (to.x - from.x) * pkt.progress + mx * 0.5;
            const py = from.y + (to.y - from.y) * pkt.progress + my * 0.5;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
      }

      // ==========================================
      // 3. MONOLITH GOLD: 24k Sparkling Gold & Ambient Sweep
      // ==========================================
      else if (isMonolith) {
        // Subtle diagonal specular gold sheen sweep
        const sweepProgress = (tick * 0.08) % 1.5;
        const sweepX = (sweepProgress - 0.25) * width * 1.5;
        const sheen = ctx.createLinearGradient(sweepX - 250, 0, sweepX + 250, height);
        sheen.addColorStop(0, 'rgba(212, 175, 55, 0)');
        sheen.addColorStop(0.5, 'rgba(212, 175, 55, 0.06)');
        sheen.addColorStop(1, 'rgba(212, 175, 55, 0)');
        ctx.fillStyle = sheen;
        ctx.fillRect(0, 0, width, height);

        // Gold dust & flares
        goldParticles.forEach((p) => {
          p.y += p.vy * 60 * dt;
          p.x += p.vx * 60 * dt;
          p.twinkle += p.twinkleSpeed;

          if (p.y < -20) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }

          const currentOpacity = p.opacity * (0.4 + 0.6 * Math.sin(p.twinkle));
          if (p.isFlare && currentOpacity > 0.45) {
            drawStarFlare(p.x + mx * 0.3, p.y + my * 0.3, p.size * 0.8, currentOpacity);
          } else {
            ctx.beginPath();
            ctx.arc(p.x + mx * 0.3, p.y + my * 0.3, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212, 175, 55, ${currentOpacity})`;
            ctx.shadowColor = '#d4af37';
            ctx.shadowBlur = 4;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
      }

      // ==========================================
      // 4. SUNSET TERRACOTTA: Warm Horizon & Rising Heat Motes
      // ==========================================
      else if (isTerracotta) {
        // Warm sunset horizon bloom
        const horizon = ctx.createLinearGradient(0, height * 0.5, 0, height);
        horizon.addColorStop(0, 'rgba(234, 88, 12, 0)');
        horizon.addColorStop(0.7, 'rgba(254, 215, 170, 0.2)');
        horizon.addColorStop(1, 'rgba(234, 88, 12, 0.15)');
        ctx.fillStyle = horizon;
        ctx.fillRect(0, 0, width, height);

        // Rising embers & heat motes
        heatMotes.forEach((m) => {
          m.y += m.vy * 60 * dt;
          m.x += (m.vx + Math.sin(tick * 1.5 + m.pulse) * 0.3) * 60 * dt;
          m.pulse += m.pulseSpeed;

          if (m.y < -30) {
            m.y = height + 20;
            m.x = Math.random() * width;
          }

          const alpha = 0.25 + 0.35 * Math.sin(m.pulse);
          ctx.beginPath();
          ctx.arc(m.x + mx * 0.25, m.y + my * 0.25, m.radius, 0, Math.PI * 2);
          ctx.fillStyle = m.color === '#ea580c' ? `rgba(234, 88, 12, ${alpha})` : `rgba(245, 158, 11, ${alpha})`;
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // ==========================================
      // 5. CYBER HORIZON: 3D Grid & Electric Sparks
      // ==========================================
      else if (isCyber) {
        // Perspective grid horizon
        const horizonY = height * 0.65;
        gridOffset = (gridOffset + 1.2 * 60 * dt) % 40;

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.lineWidth = 1;

        // Receding vertical lines to horizon center
        const vanishX = width * 0.5 + mx * 0.8;
        const lineCount = 14;
        for (let i = -lineCount; i <= lineCount; i++) {
          const bottomX = vanishX + (i * width) / lineCount;
          ctx.beginPath();
          ctx.moveTo(vanishX, horizonY);
          ctx.lineTo(bottomX, height);
          ctx.stroke();
        }

        // Horizontal perspective lines
        for (let y = horizonY; y < height; y += (y - horizonY) * 0.25 + 6) {
          const adjustedY = y + (gridOffset * (y - horizonY)) / (height - horizonY);
          if (adjustedY <= height) {
            const alpha = Math.min(0.25, ((adjustedY - horizonY) / (height - horizonY)) * 0.25);
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(0, adjustedY);
            ctx.lineTo(width, adjustedY);
            ctx.stroke();
          }
        }

        // Neon horizon glow line
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(width, horizonY);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Speed cyber sparks
        cyberSparks.forEach((spk) => {
          spk.x += spk.speed * 60 * dt;
          if (spk.x > width + 40) {
            spk.x = -40;
            spk.y = Math.random() * height;
          }
          ctx.beginPath();
          ctx.moveTo(spk.x, spk.y);
          ctx.lineTo(spk.x - spk.length, spk.y);
          ctx.strokeStyle = spk.color === '#06b6d4' ? `rgba(6, 182, 212, ${spk.opacity})` : `rgba(168, 85, 247, ${spk.opacity})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        });
      }

      // ==========================================
      // 6. LAVENDER MIST: Iridescent Fog & Wellness Orbs
      // ==========================================
      else if (isLavender) {
        // Floating iridescent bubbles
        bubbles.forEach((b) => {
          b.y += b.vy * 60 * dt;
          b.wobble += b.wobbleSpeed;
          b.x += (b.vx + Math.sin(b.wobble) * 0.4) * 60 * dt;

          if (b.y < -60) {
            b.y = height + 40;
            b.x = Math.random() * width;
          }

          const currentX = b.x + mx * 0.3;
          const currentY = b.y + my * 0.3;

          // Bubble outer iridescent circle
          ctx.save();
          ctx.beginPath();
          ctx.arc(currentX, currentY, b.radius, 0, Math.PI * 2);
          const bGrad = ctx.createRadialGradient(
            currentX - b.radius * 0.3,
            currentY - b.radius * 0.3,
            b.radius * 0.1,
            currentX,
            currentY,
            b.radius
          );
          bGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          bGrad.addColorStop(0.7, 'rgba(192, 132, 252, 0.18)');
          bGrad.addColorStop(1, 'rgba(124, 58, 237, 0.25)');
          ctx.fillStyle = bGrad;
          ctx.fill();

          ctx.strokeStyle = 'rgba(216, 180, 254, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Bubble specular reflection dot
          ctx.beginPath();
          ctx.arc(currentX - b.radius * 0.35, currentY - b.radius * 0.35, b.radius * 0.22, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.fill();
          ctx.restore();
        });
      }

      // ==========================================
      // 7. NEO BRUTALISM: Kinetic Geometric Pop Shapes
      // ==========================================
      else if (isNeo) {
        popShapes.forEach((p) => {
          p.y += p.vy * 60 * dt;
          p.x += p.vx * 60 * dt;
          p.rotation += p.vRot;

          if (p.y < -40) {
            p.y = height + 30;
            p.x = Math.random() * width;
          }
          if (p.x < -30) p.x = width + 20;
          if (p.x > width + 30) p.x = -20;

          const px = p.x + mx * 0.4;
          const py = p.y + my * 0.4;

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;

          if (p.type === 'square') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
          } else if (p.type === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (p.type === 'cross') {
            const w = p.size;
            const t = p.size / 3.5;
            ctx.fillRect(-w / 2, -t / 2, w, t);
            ctx.strokeRect(-w / 2, -t / 2, w, t);
            ctx.fillRect(-t / 2, -w / 2, t, w);
            ctx.strokeRect(-t / 2, -w / 2, t, w);
          } else {
            // Triangle
            ctx.beginPath();
            ctx.moveTo(0, -p.size / 1.5);
            ctx.lineTo(p.size / 1.5, p.size / 1.8);
            ctx.lineTo(-p.size / 1.5, p.size / 1.8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        });
      }

      // ==========================================
      // 8. EDITORIAL GAZETTE: Warm Parchment & Dust Motes
      // ==========================================
      else if (isEditorial) {
        // Warm library ambient vignette
        const vignette = ctx.createRadialGradient(width * 0.5, height * 0.4, 50, width * 0.5, height * 0.5, width * 0.7);
        vignette.addColorStop(0, 'rgba(251, 249, 244, 0)');
        vignette.addColorStop(0.7, 'rgba(120, 53, 15, 0.03)');
        vignette.addColorStop(1, 'rgba(120, 53, 15, 0.08)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);

        // Floating ink dust motes
        inkSpecks.forEach((s) => {
          s.y += s.vy * 60 * dt;
          s.x += (s.vx + Math.sin(tick * 0.8 + s.sway) * 0.25) * 60 * dt;
          s.sway += 0.02;

          if (s.y < -20) {
            s.y = height + 10;
            s.x = Math.random() * width;
          }

          ctx.beginPath();
          ctx.arc(s.x + mx * 0.2, s.y + my * 0.2, s.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(120, 53, 15, ${s.opacity})`;
          ctx.fill();
        });
      }

      // ==========================================
      // 9. CRIMSON SCHOLAR: Atomic Orbits & Academic Embers
      // ==========================================
      else if (isCrimson) {
        // Rotating atomic orbital rings in background
        const orbitCenterX = width * 0.82 + mx * 0.3;
        const orbitCenterY = height * 0.25 + my * 0.3;
        const baseRadius = 70;

        ctx.save();
        ctx.translate(orbitCenterX, orbitCenterY);
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.rotate(tick * 0.25 + (i * Math.PI) / 3);
          ctx.beginPath();
          ctx.ellipse(0, 0, baseRadius, baseRadius * 0.38, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(153, 27, 27, 0.18)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Electron particle along the ring
          const eAngle = tick * 2 + i * 2.1;
          const ex = Math.cos(eAngle) * baseRadius;
          const ey = Math.sin(eAngle) * (baseRadius * 0.38);
          ctx.beginPath();
          ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
        }
        ctx.restore();

        // Academic ascending embers
        rubySparks.forEach((spk) => {
          spk.y += spk.vy * 60 * dt;
          spk.x += (spk.vx + Math.sin(tick * 1.2 + spk.pulse) * 0.2) * 60 * dt;
          spk.pulse += spk.pulseSpeed;

          if (spk.y < -20) {
            spk.y = height + 10;
            spk.x = Math.random() * width;
          }

          const alpha = 0.2 + 0.35 * Math.sin(spk.pulse);
          ctx.beginPath();
          ctx.arc(spk.x + mx * 0.2, spk.y + my * 0.2, spk.radius, 0, Math.PI * 2);
          ctx.fillStyle = spk.glowColor === '#ef4444' ? `rgba(239, 68, 68, ${alpha})` : `rgba(153, 27, 27, ${alpha})`;
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // ==========================================
      // 10. MINIMAL STUDIO & Fallback: Precision Blueprint Grid & Crosshairs
      // ==========================================
      else {
        // Precision alignment crosshairs drifting
        draftingCrosshairs.forEach((c) => {
          c.x += c.vx * 60 * dt;
          c.y += c.vy * 60 * dt;

          if (c.x < 20 || c.x > width - 20) c.vx *= -1;
          if (c.y < 20 || c.y > height - 20) c.vy *= -1;

          const cx = c.x + mx * 0.3;
          const cy = c.y + my * 0.3;

          ctx.strokeStyle = isDark ? `rgba(255, 255, 255, ${c.opacity * 0.8})` : `rgba(24, 24, 27, ${c.opacity * 0.4})`;
          ctx.lineWidth = 1;

          // Crosshair +
          ctx.beginPath();
          ctx.moveTo(cx - c.size, cy);
          ctx.lineTo(cx + c.size, cy);
          ctx.moveTo(cx, cy - c.size);
          ctx.lineTo(cx, cy + c.size);
          ctx.stroke();

          // Tiny coordinate tag
          ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${c.opacity * 0.5})` : `rgba(24, 24, 27, ${c.opacity * 0.3})`;
          ctx.font = '9px monospace';
          ctx.fillText(`${Math.round(cx)}, ${Math.round(cy)}`, cx + 6, cy + 10);
        });

        // Slow scanning subtle guide line
        const scanY = (tick * 25) % height;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(width, scanY);
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(24, 24, 27, 0.03)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    // Pause when tab is not visible to guarantee 0 lag / 0 battery drain
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      } else {
        lastTime = performance.now();
        animFrameRef.current = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      if (interactive) window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    isBotanical,
    isMidnight,
    isMonolith,
    isTerracotta,
    isCyber,
    isLavender,
    isNeo,
    isEditorial,
    isCrimson,
    isMinimal,
    isDark,
    interactive,
    fixed,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`${fixed ? 'fixed' : 'absolute'} inset-0 pointer-events-none z-0 ${className}`}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
});

TemplateLiveAtmosphere.displayName = 'TemplateLiveAtmosphere';
