import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

export interface ImageItem {
  src: string;
  alt: string;
}

interface PhoneCarouselProps {
  images: ImageItem[];
  autoPlayInterval?: number;
}

export function PhoneCarousel({ images, autoPlayInterval = 4000 }: PhoneCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start/reset timer when current index or play status changes
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (isPlaying) {
      timerRef.current = setInterval(() => {
        handleNext();
      }, autoPlayInterval);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentIndex, isPlaying, autoPlayInterval]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  // Framer Motion slide variants
  const slideVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? "100%" : "-100%",
      opacity: 0,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
      },
    }),
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full max-w-lg mx-auto py-10">
      
      {/* ── High-Fidelity iPhone Mockup ── */}
      <div className="relative group">
        
        {/* Sleek Outer Glow & Shadow */}
        <div className="absolute -inset-1.5 rounded-[3rem] bg-gradient-to-tr from-indigo-500/20 via-violet-500/10 to-transparent blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Buttons on the sides */}
        {/* Volume Up */}
        <div className="absolute left-[-13px] top-28 w-[3px] h-12 bg-zinc-800 rounded-l border-y border-l border-white/5 z-0" />
        {/* Volume Down */}
        <div className="absolute left-[-13px] top-44 w-[3px] h-12 bg-zinc-800 rounded-l border-y border-l border-white/5 z-0" />
        {/* Power Button */}
        <div className="absolute right-[-13px] top-36 w-[3px] h-16 bg-zinc-800 rounded-r border-y border-r border-white/5 z-0" />

        {/* iPhone Outer Frame */}
        <div className="relative w-[280px] h-[570px] sm:w-[300px] sm:h-[610px] rounded-[2.75rem] border-[10px] border-zinc-900 bg-zinc-950 shadow-2xl overflow-hidden ring-1 ring-white/10 flex flex-col z-10">
          
          {/* Dynamic Island */}
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-end px-3 gap-1 shadow-inner">
            {/* Camera lens highlight */}
            <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full border border-white/5 flex items-center justify-center">
              <div className="w-1 h-1 bg-indigo-900/50 rounded-full" />
            </div>
            {/* Small status dot */}
            <div className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full animate-pulse" />
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/35 rounded-full z-40 pointer-events-none" />

          {/* Screen Content Wrapper */}
          <div className="relative w-full h-full overflow-hidden rounded-[2.15rem]">
            
            {/* Glossy sheen overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none z-30" />
            
            {/* Animated Images */}
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 w-full h-full"
              >
                <img
                  src={images[currentIndex].src}
                  alt={images[currentIndex].alt}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  loading="lazy"
                />
              </motion.div>
            </AnimatePresence>

            {/* Hover overlay description */}
            <div className="absolute bottom-10 inset-x-0 px-6 py-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white z-30 transition-all duration-300">
              <h4 className="text-sm font-semibold tracking-tight line-clamp-1">{images[currentIndex].alt}</h4>
              <p className="text-[10px] text-white/60 mt-0.5">Verified Reputation Profile</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Carousel Controls ── */}
      <div className="flex flex-col items-center gap-4 z-20">
        
        {/* Navigation buttons */}
        <div className="flex items-center gap-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-full p-1.5 backdrop-blur-md shadow-lg">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft size={18} />
          </button>
          
          <button
            onClick={togglePlay}
            className="p-2 rounded-full hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center w-9 h-9"
            aria-label={isPlaying ? "Pause carousel" : "Play carousel"}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-full hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Next image"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Indicators (Dots) */}
        <div className="flex items-center gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? "w-6 bg-[var(--accent)]" 
                  : "w-2 bg-[var(--text-secondary)]/20 hover:bg-[var(--text-secondary)]/40"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
