import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface Point {
  x: number;
  y: number;
}

interface NormalizedPoint {
  nx: number;
  ny: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

/**
 * Custom hook to generate a smooth, responsive, random Bézier curve path.
 * The path is generated normalized [0..1] once on load, and scaled to the measured dimensions.
 */
export function useRandomPath(width: number, height: number) {
  const [pathD, setPathD] = useState('');
  const normalizedPointsRef = useRef<NormalizedPoint[]>([]);

  useEffect(() => {
    // Determine number of control points based on layout height
    const numPoints = Math.max(7, Math.min(11, Math.floor(height / 450)));
    const normalizedPoints: NormalizedPoint[] = [];

    // Start near the top-middle
    normalizedPoints.push({
      nx: 0.4 + Math.random() * 0.2,
      ny: 0,
    });

    // Weave horizontally through subsequent vertical segments
    for (let i = 1; i < numPoints - 1; i++) {
      const ny = i / (numPoints - 1);
      // Alternate left/right side regions to weave around content
      const isLeft = i % 2 === 1;
      const minX = isLeft ? 0.15 : 0.55;
      const maxX = isLeft ? 0.42 : 0.82;
      const nx = minX + Math.random() * (maxX - minX);

      normalizedPoints.push({ nx, ny });
    }

    // End near the bottom-middle
    normalizedPoints.push({
      nx: 0.4 + Math.random() * 0.2,
      ny: 1,
    });

    normalizedPointsRef.current = normalizedPoints;
  }, [height]); // Regenerate normalized points if total height changes substantially

  useEffect(() => {
    if (width === 0 || height === 0 || normalizedPointsRef.current.length === 0) return;

    // Map normalized points to absolute viewport values
    const points: Point[] = normalizedPointsRef.current.map((p) => ({
      x: p.nx * width,
      y: p.ny * height,
    }));

    // Interpolate points into a smooth cubic Bezier spline
    const curvature = 0.38;
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];

      const prev = points[i - 1] || p0;
      const next = points[i + 2] || p1;

      // Exit control point
      const cp1x = p0.x + (p1.x - prev.x) * curvature;
      const cp1y = p0.y + (p1.y - prev.y) * curvature;

      // Entry control point
      const cp2x = p1.x - (next.x - p0.x) * curvature;
      const cp2y = p1.y - (next.y - p0.y) * curvature;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    setPathD(d);
  }, [width, height]);

  return pathD;
}

/**
 * Custom hook to register and bind GSAP ScrollTrigger to the scrollable container.
 */
export function useScrollPathAnimation(
  containerRef: React.RefObject<HTMLDivElement | null>,
  pathRef: React.RefObject<SVGPathElement | null>,
  onUpdate: (progress: number) => void
) {
  useEffect(() => {
    const container = containerRef.current;
    const path = pathRef.current;
    if (!container || !path) return;

    const playhead = { progress: 0 };

    const ctx = gsap.context(() => {
      gsap.to(playhead, {
        progress: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top bottom', // Triggers drawing when the post-hero container enters viewport
          end: 'bottom bottom', // Completes when scroll reaches page footer
          scrub: 0.1,           // Add subtle delay to smooth out jitter
          onUpdate: (self) => {
            onUpdate(self.progress);
          },
        },
      });
    }, container);

    return () => ctx.revert();
  }, [containerRef, pathRef, onUpdate]);
}

export function ScrollPathBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const glowPathRef = useRef<SVGPathElement>(null);
  const glowHeadRef = useRef<SVGGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const lastProgressRef = useRef(0);
  const lastPointRef = useRef<Point | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  const pathD = useRandomPath(dimensions.width, dimensions.height);

  // Measure background container boundaries dynamically
  useEffect(() => {
    const handleResize = () => {
      // Find the hero height to place our background layer exactly below the Hero section
      const heroSection = document.querySelector('section');
      const heroHeight = heroSection ? heroSection.offsetHeight : window.innerHeight;
      
      // Stop the animation exactly when the footer enters
      const footerSection = document.querySelector('footer');
      const footerOffsetTop = footerSection ? footerSection.offsetTop : document.documentElement.scrollHeight;
      
      const calculatedHeight = Math.max(1000, footerOffsetTop - heroHeight);
      
      setDimensions({
        width: window.innerWidth,
        height: calculatedHeight,
      });

      if (containerRef.current) {
        containerRef.current.style.top = `${heroHeight}px`;
        containerRef.current.style.height = `${calculatedHeight}px`;
      }
    };

    // Detect prefers-reduced-motion settings
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Initial measurement
    handleResize();

    // Re-run measurement after a short delay to accommodate page loading and rendering height
    const loadTimeout = setTimeout(handleResize, 800);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', handleMotionChange);
      clearTimeout(loadTimeout);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  // Update loop for rendering particles & ripple pulses in HTML5 canvas
  const updateCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    const ripples = ripplesRef.current;

    // 1. Process active particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(247, 147, 26, ${p.alpha * 0.75})`;
      ctx.shadowColor = '#F7931A';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }

    // 2. Process active ripples (pulses)
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.radius += r.speed;
      r.alpha -= 0.015;

      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        ripples.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(247, 147, 26, ${r.alpha * 0.8})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#F7931A';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }

    // Keep running requestAnimationFrame only if there are active animations
    if (particles.length > 0 || ripples.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(updateCanvas);
    } else {
      animationFrameIdRef.current = null;
    }
  };

  // Callback triggered by GSAP ScrollTrigger updates
  const handleScrollUpdate = (progress: number) => {
    const path = pathRef.current;
    const glowPath = glowPathRef.current;
    const glowHead = glowHeadRef.current;

    if (!path || !glowPath) return;

    const length = path.getTotalLength();

    // 1. Update drawing paths' offsets
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length * (1 - progress)}`;

    glowPath.style.strokeDasharray = `${length}`;
    glowPath.style.strokeDashoffset = `${length * (1 - progress)}`;

    if (progress === 0) {
      if (glowHead) glowHead.style.display = 'none';
      return;
    }

    if (glowHead) glowHead.style.display = 'block';

    // 2. Move glowing head along the path
    const currentPoint = path.getPointAtLength(progress * length);
    if (glowHead) {
      glowHead.setAttribute('transform', `translate(${currentPoint.x}, ${currentPoint.y})`);
    }

    // 3. Emit glowing particles while moving
    const lastPoint = lastPointRef.current || currentPoint;
    const dx = currentPoint.x - lastPoint.x;
    const dy = currentPoint.y - lastPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1.5 && !prefersReducedMotion) {
      const numParticles = 2;
      for (let i = 0; i < numParticles; i++) {
        particlesRef.current.push({
          x: currentPoint.x,
          y: currentPoint.y,
          vx: (Math.random() - 0.5) * 1.6,
          vy: (Math.random() - 0.5) * 1.6 - 0.4, // float slightly upward
          size: 1.2 + Math.random() * 2,
          alpha: 1,
          decay: 0.012 + Math.random() * 0.015,
        });
      }

      // 4. Trigger subtle pulse ripple every 400px of scrolling distance
      const currentDistance = progress * length;
      const lastDistance = lastProgressRef.current * length;
      const milestone = 400;

      if (Math.floor(currentDistance / milestone) !== Math.floor(lastDistance / milestone)) {
        ripplesRef.current.push({
          x: currentPoint.x,
          y: currentPoint.y,
          radius: 4,
          maxRadius: 45,
          alpha: 1,
          speed: 1.5,
        });
      }

      lastPointRef.current = currentPoint;

      // Start particle canvas animation loop if it's not currently running
      if (!animationFrameIdRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(updateCanvas);
      }
    }

    lastProgressRef.current = progress;
  };

  // Bind GSAP ScrollTrigger
  useScrollPathAnimation(containerRef, pathRef, handleScrollUpdate);

  // Setup full path on mount/resize for static rendering if user prefers reduced motion
  useEffect(() => {
    if (prefersReducedMotion && pathRef.current && glowPathRef.current) {
      pathRef.current.style.strokeDashoffset = '0';
      glowPathRef.current.style.strokeDashoffset = '0';
      if (glowHeadRef.current) glowHeadRef.current.style.display = 'none';
    }
  }, [prefersReducedMotion, pathD]);

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 pointer-events-none overflow-hidden select-none"
      style={{
        zIndex: 5, // Behind text (relative z-20) but above mesh gradient (z-0)
        width: '100%',
      }}
    >
      {/* HTML5 Canvas overlay for particle & pulse rendering */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute top-0 left-0 pointer-events-none w-full h-full"
        style={{ opacity: 0.7 }}
      />

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute top-0 left-0 pointer-events-none w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="orange-line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FB923C" stopOpacity="0.6" /> {/* Bright orange-400 */}
            <stop offset="35%" stopColor="#F7931A" stopOpacity="1" />
            <stop offset="70%" stopColor="#EA580C" stopOpacity="1" />
            <stop offset="100%" stopColor="#F7931A" stopOpacity="0.6" />
          </linearGradient>
          
          {/* Intense core + mid glow */}
          <filter id="bloom-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur2" />
            <feComponentTransfer in="blur2" result="brightBlur">
              <feFuncA type="linear" slope="1.4" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="brightBlur" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Large soft ambient glow filter */}
          <filter id="ambient-glow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="22" result="blur" />
          </filter>
        </defs>

        {/* Path D is generated by useRandomPath */}
        {pathD && (
          <>
            {/* Ambient Shadow glow path */}
            <path
              ref={glowPathRef}
              d={pathD}
              fill="none"
              stroke="#F7931A"
              strokeWidth="16"
              strokeLinecap="round"
              filter="url(#ambient-glow)"
              opacity="0.55"
              className="will-change-transform"
            />

            {/* Sharp foreground path with bloom filter */}
            <path
              ref={pathRef}
              d={pathD}
              fill="none"
              stroke="url(#orange-line-gradient)"
              strokeWidth="3.2"
              strokeLinecap="round"
              filter="url(#bloom-glow)"
              opacity="0.9"
              className="will-change-transform"
            />

            {/* High-frequency glowing point at the leading edge */}
            <g ref={glowHeadRef} style={{ display: 'none' }}>
              <circle cx="0" cy="0" r="12" fill="#F7931A" opacity="0.6" filter="url(#bloom-glow)" />
              <circle cx="0" cy="0" r="6" fill="#F7931A" />
              <circle cx="0" cy="0" r="2.8" fill="#FFF" />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}
