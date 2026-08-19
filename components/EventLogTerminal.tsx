'use client';

import React, { useRef, useEffect } from 'react';
import { useSafety } from '@/lib/safety-context';
import { Terminal, Play, Sparkles } from 'lucide-react';

export default function EventLogTerminal() {
  const { systemLogs, simulateDistressPhrase, speech } = useSafety();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep scrolled to top of list
  }, [systemLogs]);

  const testPhrases = [
    { label: '"Help me!"', phrase: 'Help me please, someone is following me!' },
    { label: '"Bachao!"', phrase: 'Bachao! Mujhe chodo yaha!' },
    { label: '"Code Red"', phrase: 'EDITH code red protocol alpha now' },
    { label: '"Stop it"', phrase: 'Stop it! Leave me alone!' },
    { label: '"Normal Speech"', phrase: 'Hey, I am just grabbing groceries from the corner store.' },
  ];

  return (
    <section className="glass-panel rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
      {/* Header & Quick Simulation Trigger Strip */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-1">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Terminal className="w-4 h-4 text-secondary" />
          <span className="font-mono text-xs uppercase tracking-wider font-semibold">
            Neural Event Terminal
          </span>
        </div>

        {/* Test Speech Triggers for Judges / Hackathon Demo */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] text-on-surface-variant/70 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-secondary" /> Demo Injections:
          </span>
          {testPhrases.map((tp, idx) => (
            <button
              key={idx}
              onClick={() => simulateDistressPhrase(tp.phrase)}
              title={`Simulate voice saying: ${tp.phrase}`}
              className="px-2 py-0.5 rounded bg-surface-container-high hover:bg-surface-container hover:border-secondary/40 text-[10px] font-mono text-on-surface-variant hover:text-secondary border border-white/5 transition-colors flex items-center gap-1 active:scale-95"
            >
              <Play className="w-2.5 h-2.5 text-secondary" /> {tp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Ambient Speech Recognition Stream Preview */}
      {(speech.interimTranscript || speech.transcript) && (
        <div className="px-3 py-1.5 rounded-lg bg-surface-container-lowest/80 border border-secondary/20 font-mono text-xs text-secondary flex items-start gap-2 animate-fadeIn">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/30">
            MIC TRANSCRIPT
          </span>
          <span className="truncate max-w-[85%] text-on-surface">
            {speech.interimTranscript || speech.transcript.slice(-120)}
          </span>
        </div>
      )}

      {/* Terminal Log Stream */}
      <div className="h-32 sm:h-36 overflow-y-auto custom-scrollbar flex flex-col gap-1 font-mono text-xs text-on-surface-variant/80 pr-1 select-text">
        {systemLogs.map((log) => {
          let sourceColor = 'text-secondary opacity-70';
          let msgColor = 'text-on-surface-variant';

          if (log.source === 'SOS' || log.type === 'critical') {
            sourceColor = 'text-primary font-bold';
            msgColor = 'text-primary font-semibold';
          } else if (log.source === 'AI') {
            sourceColor = 'text-tertiary font-medium';
          } else if (log.source === 'GPS') {
            sourceColor = 'text-indigo-400';
          } else if (log.source === 'CAM') {
            sourceColor = 'text-emerald-300';
          }

          return (
            <div key={log.id} className="flex items-start gap-2 hover:bg-surface-container-high/30 px-1 py-0.5 rounded transition-colors">
              <span className="text-[10px] text-on-surface-variant/40 select-none">
                {log.timestamp}
              </span>
              <span className={`text-[11px] font-bold ${sourceColor}`}>
                [{log.source}]
              </span>
              <span className={`text-xs leading-tight flex-1 ${msgColor}`}>
                {log.message}
              </span>
            </div>
          );
        })}
        <div ref={logEndRef} />
      </div>

      <div className="absolute bottom-0 left-0 w-full h-5 bg-gradient-to-t from-surface-container via-surface-container/80 to-transparent pointer-events-none" />
    </section>
  );
}
