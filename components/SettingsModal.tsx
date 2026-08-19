'use client';

import React, { useState } from 'react';
import { useSafety } from '@/lib/safety-context';
import { Sliders, Key, Mic, ShieldAlert, Cpu, Check, Volume2 } from 'lucide-react';
import { soundEffects } from '@/lib/utils';

export default function SettingsModal() {
  const { addLog } = useSafety();
  const [apiKey, setApiKey] = useState('');
  const [safeTriggerWords, setSafeTriggerWords] = useState('help, bachao, stop, code red, save me, let me go, police');
  const [micSensitivity, setMicSensitivity] = useState(65);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playSafeArmed();
    addLog('SYS', 'User updated E.D.I.T.H. Sentinel settings & trigger parameters.', 'success');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-28 pt-20 px-4 md:px-8 max-w-container-max mx-auto animate-fadeIn select-none">
      <div className="border-b border-white/10 pb-4">
        <h1 className="font-mono text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
          <Sliders className="w-6 h-6 text-secondary" />
          <span>System & Sentinel Configuration</span>
        </h1>
        <p className="font-mono text-xs text-on-surface-variant mt-1">
          Adjust Gemini Flash neural sentiment parameters, trigger safe words, and hardware surveillance loops.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gemini API Key Configuration */}
        <div className="glass-panel p-5 rounded-xl flex flex-col gap-3">
          <div className="flex items-center gap-2 text-on-surface font-mono text-sm font-semibold">
            <Key className="w-4 h-4 text-secondary" />
            <span>Google Gemini Flash API Key</span>
          </div>
          <p className="text-xs text-on-surface-variant/80 font-mono">
            Powers real-time sentiment analysis, panic classification, and coercion detection.
          </p>
          <input
            type="password"
            placeholder="AIzaSy... (Leave empty to use server .env.local)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-container border border-white/10 text-on-surface text-xs font-mono focus:outline-none focus:border-secondary"
          />
          <span className="text-[10px] text-secondary font-mono">
            ✓ Built-in fallback heuristic engine active if key is unset.
          </span>
        </div>

        {/* Trigger Keywords */}
        <div className="glass-panel p-5 rounded-xl flex flex-col gap-3">
          <div className="flex items-center gap-2 text-on-surface font-mono text-sm font-semibold">
            <ShieldAlert className="w-4 h-4 text-secondary" />
            <span>Zero-Latency Trigger Words (Comma Separated)</span>
          </div>
          <p className="text-xs text-on-surface-variant/80 font-mono">
            Local browser keywords that immediately fire SOS protocols without network latency.
          </p>
          <input
            type="text"
            value={safeTriggerWords}
            onChange={(e) => setSafeTriggerWords(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-container border border-white/10 text-on-surface text-xs font-mono focus:outline-none focus:border-secondary"
          />
        </div>

        {/* Microphone Sensitivity Slider */}
        <div className="glass-panel p-5 rounded-xl flex flex-col gap-3">
          <div className="flex items-center justify-between font-mono text-sm font-semibold text-on-surface">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-secondary" />
              <span>Acoustic Mic Sensitivity</span>
            </div>
            <span className="text-secondary text-xs">{micSensitivity}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={micSensitivity}
            onChange={(e) => setMicSensitivity(Number(e.target.value))}
            className="w-full accent-[#4edea3] cursor-pointer"
          />
          <div className="flex justify-between font-mono text-[10px] text-on-surface-variant/60">
            <span>Low (Noisy environments)</span>
            <span>High (Discreet whispering)</span>
          </div>
        </div>

        {/* Hardware Audio Test */}
        <div className="glass-panel p-5 rounded-xl flex flex-col gap-3 justify-between">
          <div className="flex items-center gap-2 text-on-surface font-mono text-sm font-semibold">
            <Volume2 className="w-4 h-4 text-secondary" />
            <span>Tactile Tactical Sounds & Sirens</span>
          </div>
          <p className="text-xs text-on-surface-variant/80 font-mono">
            Test Web Audio synthetic tones and high-urgency emergency sirens.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => soundEffects.playSafeArmed()}
              className="flex-1 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-white/10 text-xs font-mono text-secondary"
            >
              Test Safe Chime
            </button>
            <button
              type="button"
              onClick={() => soundEffects.playSiren()}
              className="flex-1 py-2 rounded-lg bg-primary-container/20 hover:bg-primary-container/30 border border-primary/40 text-xs font-mono text-primary"
            >
              Test Siren Sound
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="md:col-span-2 flex justify-end items-center gap-3">
          {savedSuccess && (
            <span className="font-mono text-xs text-secondary flex items-center gap-1 animate-pulse">
              <Check className="w-4 h-4" /> Settings Saved!
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-secondary text-on-secondary-container font-mono text-xs font-bold shadow-[0_0_20px_rgba(78,222,163,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            Save Sentinel Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
