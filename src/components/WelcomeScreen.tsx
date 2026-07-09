import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Terminal, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import QuantumCryptsLogo from './QuantumCryptsLogo';

interface WelcomeScreenProps {
  onEnter: (nickname: string) => void;
}

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [typingText, setTypingText] = useState('');
  const fullText = "AUTHENTICATION SIGNAL DETECTED: ACCESSING UFTB HUB...";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setTypingText((prev) => prev + fullText.charAt(index));
      index++;
      if (index >= fullText.length) {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setError('A secure nickname identifier is required.');
      return;
    }
    if (trimmedNickname.length > 20) {
      setError('Identifier must be 20 characters or less.');
      return;
    }
    if (password !== 'cyber26') {
      setError('Access Denied: Invalid community authorization code.');
      return;
    }
    onEnter(trimmedNickname);
  };

  return (
    <div id="welcome-screen-wrapper" className="flex items-center justify-center min-h-screen px-4 py-8 relative">
      <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(6,182,212,0.06)_0%,transparent_70%] pointer-events-none" />

      {/* Decorative Glowing Static Nodes */}
      <div className="absolute top-20 left-10 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee] pointer-events-none animate-pulse"></div>
      <div className="absolute top-21 left-10 w-[120px] h-px bg-gradient-to-r from-cyan-400 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-40 right-20 w-3.5 h-3.5 bg-emerald-400 rounded-full shadow-[0_0_18px_#34d399] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-41 right-20 w-[180px] h-px bg-gradient-to-l from-emerald-400 to-transparent pointer-events-none"></div>

      <motion.div
        id="welcome-terminal-card"
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-lg bg-slate-950/60 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden"
      >
        {/* Decorative corner glows */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

        {/* Header decoration */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <span className="text-[10px] font-mono tracking-wider text-cyan-400/80 uppercase font-semibold">
            Community Port Open
          </span>
        </div>

        {/* Central visual branding */}
        <div className="flex flex-col items-center text-center mb-8 relative">
          <div className="w-28 h-28 bg-black rounded-2xl border border-cyan-500/30 p-1 relative shadow-[0_0_25px_rgba(6,182,212,0.25)] mb-6 transition-transform duration-300 flex items-center justify-center hover:scale-105">
            {/* Spinning tactical rings */}
            <div className="absolute w-36 h-36 border border-cyan-500/30 border-dashed rounded-full animate-[spin_30s_linear_infinite] pointer-events-none" />
            <div className="absolute w-44 h-44 border border-emerald-500/20 border-double rounded-full animate-[spin_15s_linear_infinite] pointer-events-none" />
            <div className="absolute -inset-0.5 bg-cyan-500/10 rounded-2xl blur-md opacity-50 -z-10" />
            <QuantumCryptsLogo className="w-full h-full text-cyan-400" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 uppercase italic mb-2 select-none filter drop-shadow-[0_2px_10px_rgba(6,182,212,0.3)]">
            UFTB Cyber Community
          </h1>

          <div className="text-[10px] text-cyan-400/80 font-mono tracking-[0.32em] uppercase mb-5 font-semibold">
            Gateway Handshake Established
          </div>

          {/* Sligthly larger message display as requested */}
          <div className="min-h-[40px] flex items-center justify-center px-4 py-2.5 bg-slate-900/60 border border-cyan-500/20 rounded-xl w-full shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]">
            <p className="text-xs sm:text-sm font-mono text-cyan-300 tracking-wide uppercase font-semibold text-center leading-relaxed">
              {typingText}
              <span className="animate-pulse inline-block w-1.5 h-3 bg-cyan-400 ml-1"></span>
            </p>
          </div>
        </div>

        {/* Tactical status bar */}
        <div className="grid grid-cols-3 gap-2 border-t border-b border-cyan-500/20 py-3 mb-6 text-[9px] font-mono uppercase tracking-wider text-slate-400 text-center bg-slate-950/40 rounded-lg">
          <div>
            <span className="block text-cyan-400 font-bold animate-pulse">● CONNECTED</span>
            STATUS
          </div>
          <div className="border-l border-r border-cyan-500/20">
            <span className="block text-emerald-400 font-bold">NODE SAFE</span>
            SECURED
          </div>
          <div>
            <span className="block text-blue-400 font-bold">PORT-3000</span>
            TUNNEL
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname-input" className="block text-[10px] text-slate-400 uppercase mb-2 ml-1 font-mono tracking-wider">
              GST Roll / Identity Signal
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/60">
                <Terminal className="w-4 h-4" />
              </div>
              <input
                id="nickname-input"
                type="text"
                placeholder="Enter GST Roll or Nickname..."
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500/80 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none font-mono text-xs tracking-wide transition-all focus:ring-1 focus:ring-cyan-500/20 shadow-inner"
                required
                maxLength={30}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-cyan-400/60">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="password-input" className="block text-[10px] text-slate-400 uppercase mb-2 ml-1 font-mono tracking-wider">
              Community Access Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/60">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password-input"
                type="password"
                placeholder="Enter Community Password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500/80 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none font-mono text-xs tracking-wide transition-all focus:ring-1 focus:ring-cyan-500/20 shadow-inner"
                required
              />
            </div>
            {error && (
              <p className="mt-3 text-xs text-red-400 font-mono flex items-center bg-red-950/40 border border-red-500/20 p-2.5 rounded-lg">
                <span className="mr-1.5">⚠</span> {error}
              </p>
            )}
          </div>

          <button
            id="enter-community-btn"
            type="submit"
            className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center space-x-2 group active:scale-[0.98] shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_20px_rgba(34,211,238,0.35)]"
          >
            <span>Decrypt Gateway</span>
            <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
          </button>
        </form>

        <div className="mt-8 text-center border-t border-cyan-500/10 pt-4">
          <p className="text-[10px] font-mono text-cyan-500/40 tracking-wider">
            SECURE SHA256 CONNECTION • DECANTED COMMUNITY ROUTER
          </p>
        </div>
      </motion.div>
    </div>
  );
}
