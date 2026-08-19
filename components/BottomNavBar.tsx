'use client';

import React from 'react';
import { useSafety } from '@/lib/safety-context';
import {
  Activity,
  FolderArchive,
  Users,
  Sliders,
  EyeOff,
  AlertOctagon,
} from 'lucide-react';

export default function BottomNavBar() {
  const { activeTab, setActiveTab, toggleCamouflage, triggerEmergency } = useSafety();

  const navItems = [
    { id: 'dashboard', label: 'Status', icon: Activity },
    { id: 'vault', label: 'Evidence', icon: FolderArchive },
    { id: 'contacts', label: 'Guardians', icon: Users },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ] as const;

  return (
    <div className="fixed bottom-0 w-full z-40 flex flex-col pointer-events-none select-none">
      {/* Floating Tactical Actions Row */}
      <div className="flex justify-between items-center px-4 md:px-8 pb-3 pointer-events-none max-w-container-max mx-auto w-full">
        {/* Stealth / Camo Quick Toggle */}
        <button
          onClick={toggleCamouflage}
          title="Engage Discreet Camouflage Disguise Screen"
          className="pointer-events-auto h-11 px-4 rounded-xl glass-panel flex items-center gap-2 hover:bg-surface-container hover:border-secondary/40 text-on-surface-variant hover:text-white transition-all border border-white/10 shadow-lg active:scale-95"
        >
          <EyeOff className="w-4 h-4 text-secondary" />
          <span className="font-mono text-xs font-semibold hidden sm:inline">CAMO STEALTH</span>
        </button>

        {/* Big Crimson SOS Panic Trigger Button */}
        <button
          onClick={() => triggerEmergency('MANUAL TAP ON PRIMARY SOS BUTTON')}
          title="Trigger Immediate High-Priority SOS Protocol"
          className="pointer-events-auto h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-primary-container text-on-primary-container font-mono text-sm sm:text-base font-black tracking-widest flex items-center gap-2 shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:scale-105 active:scale-95 transition-all border border-primary/40 uppercase"
        >
          <AlertOctagon className="w-5 h-5 animate-pulse" />
          <span>SOS EMERGENCY</span>
        </button>
      </div>

      {/* Glassmorphic Bottom Navigation Bar */}
      <nav className="pointer-events-auto bottom-nav-bar flex justify-around items-center h-16 md:h-18 px-4 w-full border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center rounded-xl px-4 py-1 transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'bg-secondary/15 text-secondary border border-secondary/30 shadow-[0_0_15px_rgba(78,222,163,0.25)]'
                  : 'text-on-surface-variant/70 hover:text-on-surface hover:opacity-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-secondary' : ''}`} />
              <span className="font-mono text-[10px] mt-0.5 font-bold tracking-wider uppercase">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
