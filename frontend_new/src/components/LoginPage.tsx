import { useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
// REMOVED: import { useNotifications } from '../hooks/useNotificationFeed'; // This is for fetching notification *feed* data
import { useNotification } from '../contexts/NotificationContext'; // <-- ADDED: This is for showing toast notifications

import { GraduationCap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine, ISourceOptions } from "tsparticles-engine";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const { user, login, signup } = useAuth();
  // CORRECTED LINE: Destructure showError and showSuccess from useNotification()
  const { showError, showSuccess } = useNotification(); 

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions: ISourceOptions = {
    background: { color: { value: '#0A0F18' } },
    fpsLimit: 60,
    interactivity: {
      events: { onHover: { enable: true, mode: 'repulse' } },
      modes: { repulse: { distance: 80, duration: 0.4 } },
    },
    particles: {
      color: { value: '#ffffff' },
      links: { color: '#ffffff', distance: 150, enable: true, opacity: 0.1, width: 1 },
      move: { direction: 'none', enable: true, outModes: { default: 'bounce' }, random: false, speed: 0.5, straight: false },
      number: { density: { enable: true, area: 800 }, value: 80 },
      opacity: { value: 0.1 },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 2 } },
    },
    detectRetina: true,
  };

  if (user) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      const msg = 'Passwords do not match';
      setFeedbackMessage(msg);
      showError(msg);
      return;
    }

    setLoading(true);
    setFeedbackMessage('');

    try {
      if (isLogin) {
        await login(email, password);
        setFeedbackMessage('Welcome back!');
        showSuccess('Welcome back!');
      } else {
        await signup(email, password);
        setFeedbackMessage('Account created successfully!');
        showSuccess('Account created successfully!');
      }
    } catch (error: unknown) {
      let errorMessage = 'Authentication failed';
      if (error instanceof Error) {
        if (error.message.includes("network-request-failed")) {
          errorMessage = 'Check your internet connection or try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      setFeedbackMessage(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F18] flex items-center justify-center p-4 font-body text-gray-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Russo+One&family=VT323&display=swap');
        .font-heading { font-family: 'Russo One', sans-serif; }
        .font-body { font-family: 'VT323', monospace; }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>

      <Particles id="tsparticles-login" init={particlesInit} options={particlesOptions} />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-gray-900/50 rounded-2xl shadow-2xl p-8 border border-white/10 backdrop-blur-lg">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-cyan-400/50">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 font-heading tracking-wider">EVAL-AI</h1>
            <p className="text-gray-400 text-lg">
              {isLogin ? 'Welcome Back, Educator' : 'Create Your Account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" aria-describedby="form-feedback">
            <div>
              <label htmlFor="email" className="sr-only">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  placeholder="Email Address"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                  placeholder="Password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors" aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white"
                    placeholder="Confirm Password"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 px-4 rounded-lg font-bold hover:from-blue-700 hover:to-cyan-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 font-heading tracking-wider"
            >
              {loading ? <LoadingSpinner size="small" text={isLogin ? 'Signing in...' : 'Creating account...'} /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* ARIA live region */}
          <div id="form-feedback" aria-live="assertive" className="sr-only">
            {feedbackMessage}
          </div>

          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-lg">
              {isLogin ? "Need an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;