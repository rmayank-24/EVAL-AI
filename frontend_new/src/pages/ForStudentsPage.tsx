import { ReactNode, useRef, useState, useEffect, useCallback } from 'react';
import { motion, Variants } from 'framer-motion';
import { Lightbulb, Rocket, ShieldCheck, ArrowRight } from 'lucide-react';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
// 1. Import the necessary types from the particles engine
import type { Engine, ISourceOptions } from "tsparticles-engine";

// A wrapper component to handle the font import and global styles.
const StyleWrapper = ({ children }: { children: ReactNode }) => (
  <>
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Russo+One&family=VT323&display=swap');
        
        body, html {
          cursor: none; /* Hide the default system cursor */
        }

        .font-heading { font-family: 'Russo One', sans-serif; }
        .font-body { font-family: 'VT323', monospace; }
      `}
    </style>
    {children}
  </>
);

// Optimized custom cursor
const CustomCursor = () => {
  const mainCursorRef = useRef<HTMLDivElement>(null);
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (mainCursorRef.current) {
        mainCursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };
    const onMouseOver = (e: MouseEvent) => {
      if ((e.target as Element).closest('a, button, .cursor-pointer')) setIsPointer(true);
    };
    const onMouseOut = (e: MouseEvent) => {
      if ((e.target as Element).closest('a, button, .cursor-pointer')) setIsPointer(false);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
    };
  }, []);

  return (
    <div
      ref={mainCursorRef}
      className={`fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[9999] transition-transform duration-200 ease-out`}
    >
      <div className={`w-8 h-8 rounded-full border-2 border-cyan-400/50 transition-all duration-200 ${isPointer ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}></div>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-300 rounded-full transition-all duration-200 ${isPointer ? 'scale-125' : 'scale-100'}`}></div>
    </div>
  );
};

const FeatureDetail = ({ icon, title, description, index }: { icon: ReactNode, title: string, description: string, index: number }) => {
    const itemVariants: Variants = {
        hidden: { opacity: 0, x: -50 },
        visible: { 
            opacity: 1, 
            x: 0,
            transition: { delay: index * 0.2, duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        <motion.div variants={itemVariants} className="flex items-start gap-6">
            <div className="bg-blue-500/10 text-blue-400 rounded-lg w-12 h-12 flex-shrink-0 flex items-center justify-center border border-blue-500/20 mt-1">
                {icon}
            </div>
            <div>
                <h3 className="text-2xl font-bold text-gray-100 mb-2 font-heading tracking-wider">{title}</h3>
                <p className="text-gray-400 font-body text-lg leading-relaxed">{description}</p>
            </div>
        </motion.div>
    );
}

export default function ForStudentsPage() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  // 2. Apply the correct type to the particles options object
  const particlesOptions: ISourceOptions = {
    background: { color: { value: '#0A0F18' } },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'repulse' },
      },
      modes: {
        repulse: { distance: 80, duration: 0.4 },
      },
    },
    particles: {
      color: { value: '#ffffff' },
      links: {
        color: '#ffffff',
        distance: 150,
        enable: true,
        opacity: 0.1,
        width: 1,
      },
      move: {
        direction: 'none',
        enable: true,
        outModes: { default: 'bounce' },
        random: false,
        speed: 0.5,
        straight: false,
      },
      number: { density: { enable: true, area: 800 }, value: 80 },
      opacity: { value: 0.1 },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 2 } },
    },
    detectRetina: true,
  };
  
  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } }
  };

  const headingVariants: Variants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  const paragraphVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delay: 0.3, duration: 0.8 } }
  };

  return (
    <StyleWrapper>
      <CustomCursor />
      <div className="bg-[#0A0F18] text-gray-300 min-h-screen overflow-x-hidden relative">
        {/* 3. The 'as any' cast is no longer needed here */}
        <Particles id="tsparticles-students" init={particlesInit} options={particlesOptions} />
        <div className="relative z-10">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container mx-auto px-6 py-5 flex justify-between items-center"
          >
            <a href="/" className="text-2xl font-bold text-white font-heading cursor-pointer tracking-widest">EVAL-AI 🤖</a>
            <div className="flex items-center gap-6">
              <a href="/login" className="text-gray-400 hover:text-white transition-colors font-body cursor-pointer text-lg">Login</a>
              <a href="/signup" className="bg-white text-black font-bold px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-heading flex items-center gap-2 cursor-pointer text-sm">
                Sign Up <ArrowRight size={16} />
              </a>
            </div>
          </motion.header>

          {/* Main Content */}
          <main className="container mx-auto px-6 py-20">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
                <motion.h1 
                    variants={headingVariants}
                    className="text-5xl md:text-7xl font-black text-white leading-tight font-heading tracking-wider text-center"
                >
                    For Students
                </motion.h1>
                <motion.p 
                    variants={paragraphVariants}
                    className="mt-6 max-w-3xl mx-auto text-center text-xl text-gray-400 font-body leading-relaxed"
                >
                    Your personal AI study partner. Get instant help with your homework, understand your mistakes, and power-up your grades.
                </motion.p>
            </motion.div>

            <div className="mt-24 max-w-4xl mx-auto">
                <motion.div 
                    className="space-y-16"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={containerVariants}
                >
                    <FeatureDetail 
                        icon={<Lightbulb size={24} />}
                        title="Instant Homework Help"
                        description="No more waiting for grades. Submit your work and get immediate, private feedback to see exactly where you can improve."
                        index={0}
                    />
                    <FeatureDetail 
                        icon={<Rocket size={24} />}
                        title="Learn Faster, Not Harder"
                        description="Understand complex topics and fix your mistakes instantly. Our AI helps you study smarter and prepare for exams more effectively."
                        index={1}
                    />
                    <FeatureDetail 
                        icon={<ShieldCheck size={24} />}
                        title="Private & Personalized"
                        description="Your submissions and AI feedback are completely private. Learn and grow in a judgment-free space to build your confidence."
                        index={2}
                    />
                </motion.div>
            </div>
          </main>
        </div>
      </div>
    </StyleWrapper>
  );
}
