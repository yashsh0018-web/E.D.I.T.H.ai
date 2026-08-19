'use client';

import React, { useState, useRef } from 'react';
import { useSafety } from '@/lib/safety-context';
import {
  Search,
  ShoppingCart,
  Mic,
  CheckCircle2,
  FileText,
  Headphones,
  Home,
  Folder,
  Plus,
  ArrowRight,
  Phone,
  PhoneOff,
  User,
  Shield,
  Volume2,
} from 'lucide-react';

export default function CamouflageScreen() {
  const { toggleCamouflage, triggerEmergency, speech, camouflageApp, setCamouflageApp } = useSafety();
  const [longPressProgress, setLongPressProgress] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [covertAlertDispatched, setCovertAlertDispatched] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hidden Gesture 1: Long Press on Title (Hold for 1.5s to restore HUD)
  const handleTouchStart = () => {
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += 10;
      setLongPressProgress(Math.min(100, progress));
    }, 120);

    pressTimerRef.current = setTimeout(() => {
      clearInterval(progressIntervalRef.current!);
      setLongPressProgress(0);
      toggleCamouflage();
    }, 1300);
  };

  const handleTouchEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setLongPressProgress(0);
  };

  // Hidden Gesture 2: Triple Tap Screen Area to reveal
  const handleScreenTripleTap = () => {
    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        toggleCamouflage();
        return 0;
      }
      setTimeout(() => setTapCount(0), 600);
      return next;
    });
  };

  // Covert Action: Secret tap on disguised item dispatches silent SOS
  const handleCovertSOSTrigger = () => {
    setCovertAlertDispatched(true);
    triggerEmergency('Covert Trigger from Camouflage Mode');
    setTimeout(() => setCovertAlertDispatched(false), 3000);
  };

  return (
    <div
      onClick={handleScreenTripleTap}
      className="fixed inset-0 z-50 bg-surface-container-lowest text-on-surface flex flex-col font-sans select-none overflow-y-auto animate-fadeIn"
    >
      {/* Covert Toast Notification */}
      {covertAlertDispatched && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-black/80 text-secondary border border-secondary/30 text-xs font-mono flex items-center gap-2 animate-bounce">
          <Shield className="w-3.5 h-3.5" />
          <span>Covert Sentinel SOS Dispatched</span>
        </div>
      )}

      {/* Camouflage Mode Switcher (discreet pill at very top) */}
      <div className="flex justify-between items-center px-4 py-1.5 bg-surface-container-low border-b border-white/5 text-[11px] font-mono text-on-surface-variant/60">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          Background AI Mic Active ({speech.audioLevel}%)
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCamouflageApp(camouflageApp === 'workspace' ? 'fakecall' : 'workspace');
            }}
            className="hover:text-white underline text-[10px]"
          >
            Switch to {camouflageApp === 'workspace' ? 'Fake Call' : 'Notes App'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCamouflage();
            }}
            className="hover:text-secondary underline text-[10px]"
          >
            Exit Stealth
          </button>
        </div>
      </div>

      {camouflageApp === 'workspace' ? (
        /* DISGUISED VIEW 1: Workspace / Notes App */
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="w-full flex justify-between items-center px-5 h-16 glass-card border-b-0 shadow-sm relative">
            {/* Long-press secret target */}
            <div
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative cursor-pointer py-2 px-1"
            >
              <h1 className="font-semibold text-lg text-on-surface">Workspace</h1>
              {longPressProgress > 0 && (
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-secondary rounded-full transition-all"
                  style={{ width: `${longPressProgress}%` }}
                />
              )}
            </div>

            <div className="flex gap-3 items-center">
              <Search className="w-5 h-5 text-on-surface-variant cursor-pointer" />
              <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center text-xs font-semibold text-on-surface">
                YS
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 px-5 py-6 pb-24 space-y-6 max-w-lg mx-auto w-full">
            {/* Pinned Bento Grid */}
            <section>
              <h2 className="font-mono text-xs text-on-surface-variant/70 mb-3 uppercase tracking-widest">
                Pinned Notes
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {/* Covert emergency trigger disguised as grocery list */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCovertSOSTrigger();
                  }}
                  className="glass-card rounded-xl p-4 flex flex-col justify-between min-h-[130px] cursor-pointer hover:bg-surface-container transition-colors"
                >
                  <ShoppingCart className="w-5 h-5 text-on-surface-variant mb-2" />
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface leading-tight">Grocery List</h3>
                    <p className="font-mono text-[10px] text-on-surface-variant mt-1">Updated 2h ago</p>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-4 flex flex-col justify-between min-h-[130px] cursor-pointer hover:bg-surface-container transition-colors bg-gradient-to-br from-surface-container-low to-surface-container">
                  <Mic className="w-5 h-5 text-tertiary mb-2" />
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface leading-tight">Tech Trends Ep. 42</h3>
                    <p className="font-mono text-[10px] text-on-surface-variant mt-1">Podcast • 45m left</p>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-4 col-span-2 flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <div>
                      <h3 className="text-sm font-medium text-on-surface">Weekly Planning</h3>
                      <p className="font-mono text-[10px] text-on-surface-variant">3/5 tasks completed</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full glass-card flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-on-surface" />
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Notes */}
            <section>
              <h2 className="font-mono text-xs text-on-surface-variant/70 mb-3 uppercase tracking-widest">
                Recent Documents
              </h2>
              <div className="space-y-2.5">
                <div className="glass-card rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center border border-white/5">
                      <FileText className="w-4 h-4 text-on-surface-variant" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-on-surface">Hackathon Deliverables</h4>
                      <p className="font-mono text-[10px] text-on-surface-variant truncate max-w-[200px]">
                        Sprint timeline for Q3 project...
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant/60">Yesterday</span>
                </div>

                <div className="glass-card rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center border border-white/5">
                      <Headphones className="w-4 h-4 text-on-surface-variant" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-on-surface">Design Audio Walkthrough</h4>
                      <p className="font-mono text-[10px] text-on-surface-variant truncate max-w-[200px]">
                        Saved Voice Note
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant/60">Oct 12</span>
                </div>
              </div>
            </section>
          </main>

          {/* Fake Bottom Navigation */}
          <nav className="fixed bottom-0 w-full glass-card flex justify-around items-center h-16 px-4 border-t-0 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col items-center justify-center text-on-surface cursor-pointer">
              <Home className="w-5 h-5 text-secondary" />
              <span className="font-mono text-[9px] mt-0.5">Home</span>
            </div>
            <div className="flex flex-col items-center justify-center text-on-surface-variant/70 cursor-pointer">
              <Folder className="w-5 h-5" />
              <span className="font-mono text-[9px] mt-0.5">Files</span>
            </div>
            <div className="flex flex-col items-center justify-center text-on-surface-variant/70 cursor-pointer -mt-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center shadow-lg">
                <Plus className="w-5 h-5 text-on-surface" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center text-on-surface-variant/70 cursor-pointer">
              <Mic className="w-5 h-5" />
              <span className="font-mono text-[9px] mt-0.5">Voice</span>
            </div>
          </nav>
        </div>
      ) : (
        /* DISGUISED VIEW 2: Realistic Fake Active Phone Call Screen */
        <div className="flex-1 flex flex-col items-center justify-between py-12 px-6 max-w-sm mx-auto w-full">
          <div className="flex flex-col items-center text-center mt-6">
            <div className="w-24 h-24 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center mb-4 shadow-2xl">
              <User className="w-12 h-12 text-on-surface-variant" />
            </div>
            <h2 className="text-xl font-semibold text-on-surface">Mom</h2>
            <span className="font-mono text-xs text-secondary mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> 04:12 • HD Call
            </span>
          </div>

          <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-white/10">
                <Mic className="w-5 h-5 text-on-surface" />
              </div>
              <span className="text-[11px] text-on-surface-variant">Mute</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-white/10">
                <Volume2 className="w-5 h-5 text-on-surface" />
              </div>
              <span className="text-[11px] text-on-surface-variant">Speaker</span>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleCovertSOSTrigger();
              }}
              className="flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center border border-white/10">
                <Plus className="w-5 h-5 text-on-surface" />
              </div>
              <span className="text-[11px] text-on-surface-variant">Add Call</span>
            </div>
          </div>

          <div className="flex justify-center w-full mb-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCamouflage();
              }}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
