import { useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { BrainCircuit, Users, ClipboardCheck, ArrowRight } from 'lucide-react';
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

// Animated Headline Component
const AnimatedHeadline = ({ text }: { text: string }) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()";
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(prev => 
        prev.split("").map((_, index) => {
          if (index < iteration) {
            return text[index];
          }
          return letters[Math.floor(Math.random() * letters.length)];
        }).join("")
      );
      if (iteration >= text.length) {
        clearInterval(interval);
      }
      iteration += 1 / 2; // Slower, more deliberate animation
    }, 40);

    return () => clearInterval(interval);
  }, [text]);

  return <span className="inline-block">{displayText}</span>;
};


interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  index: number;
  linkTo: string; // Add a prop for the link destination
}

const FeatureCard = ({ icon, title, description, index, linkTo }: FeatureCardProps) => {
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, y: 0,
      transition: { delay: index * 0.2, duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <motion.a 
      href={linkTo}
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -5, boxShadow: '0 0 30px rgba(59, 130, 246, 0.15)' }}
      className="bg-gray-900/30 p-8 rounded-xl border border-white/10 backdrop-blur-md relative overflow-hidden group h-full block cursor-pointer"
    >
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0,_rgba(59,130,246,0.1),_rgba(59,130,246,0)_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="bg-blue-500/10 text-blue-400 rounded-lg w-12 h-12 flex items-center justify-center mb-6 border border-blue-500/20">
          {icon}
        </div>
        <h4 className="text-2xl font-bold text-gray-100 mb-4 font-heading tracking-wider">{title}</h4>
        <p className="text-gray-400 font-body text-lg leading-relaxed">{description}</p>
      </div>
    </motion.a>
  );
};


export default function LandingPage() {
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
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
  };
  
  const headline = "Unlock a Smarter Learning Experience.";

  return (
    <StyleWrapper>
      <CustomCursor />
      <div className="bg-[#0A0F18] text-gray-300 min-h-screen overflow-hidden">
        {/* 3. The 'as any' cast is no longer needed here */}
        <Particles id="tsparticles" init={particlesInit} options={particlesOptions} />
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="container mx-auto px-6 py-5 flex justify-between items-center"
          >
            <h1 className="text-2xl font-bold text-white font-heading cursor-pointer tracking-widest">EVAL-AI 🤖</h1>
            <div className="flex items-center gap-6">
              <a href="/login" className="text-gray-400 hover:text-white transition-colors font-body cursor-pointer text-lg">Login</a>
              <a href="/signup" className="bg-white text-black font-bold px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-heading flex items-center gap-2 cursor-pointer text-sm">
                Get Started <ArrowRight size={16} />
              </a>
            </div>
          </motion.header>

          {/* Hero Section */}
          <main className="container mx-auto px-6 text-center flex-grow flex flex-col justify-center">
            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight font-heading tracking-wider">
              <AnimatedHeadline text={headline} />
            </h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5, duration: 0.8, ease: "easeOut" }}
              className="mt-8 max-w-2xl mx-auto text-xl text-gray-400 font-body leading-relaxed"
            >
              The AI-powered LMS that saves teachers time and helps students learn faster. Automated grading, instant feedback, and powerful insights.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.8, duration: 0.5, ease: "easeOut" }}
              className="mt-10 flex justify-center"
            >
              <a href="/signup" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-8 py-3 rounded-md text-md hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-[0_0_30px_rgba(59,130,246,0.4)] block cursor-pointer font-heading tracking-wider">
                Get Started for Free
              </a>
            </motion.div>
          </main>
        </div>
      </div>
      
      {/* Features Section */}
      <section className="py-24 bg-[#0A0F18] relative z-10">
        <div className="container mx-auto px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={containerVariants}
              className="text-center mb-16"
            >
              <h3 className="text-4xl font-bold text-white font-heading tracking-wider">A New Dimension in Education</h3>
              <p className="text-gray-400 mt-4 font-body text-xl">Tools designed to empower teachers and inspire students.</p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard icon={<BrainCircuit size={24} />} title="For Teachers" description="Automate grading, eliminate busywork, and spend more time teaching. Get powerful insights into class performance." index={0} linkTo="/for-teachers" />
              <FeatureCard icon={<Users size={24} />} title="For Students" description="Receive instant, private feedback on your work. Understand your mistakes and learn faster than ever before." index={1} linkTo="/for-students" />
              <FeatureCard icon={<ClipboardCheck size={24} />} title="For Admins" description="A simple, unified dashboard to manage users, subjects, and view school-wide analytics with ease." index={2} linkTo="/for-admins" />
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0F18] border-t border-white/10 py-8 relative z-10">
        <div className="container mx-auto px-6 text-center text-gray-500 font-body text-lg">
          <p>&copy; {new Date().getFullYear()} EVAL-AI. All Rights Reserved.</p>
        </div>
      </footer>
    </StyleWrapper>
  );
}
