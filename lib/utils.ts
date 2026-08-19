import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCoordinates(lat: number, lng: number): { latStr: string; lngStr: string } {
  const latDirection = lat >= 0 ? 'N' : 'S';
  const lngDirection = lng >= 0 ? 'E' : 'W';
  return {
    latStr: `LAT: ${Math.abs(lat).toFixed(4)}° ${latDirection}`,
    lngStr: `LNG: ${Math.abs(lng).toFixed(4)}° ${lngDirection}`,
  };
}

export function formatTimeUTC(date: Date = new Date()): string {
  return date.toTimeString().split(' ')[0] + ' UTC';
}

export function generateIncidentId(): string {
  return '#' + Math.floor(1000 + Math.random() * 9000).toString();
}

export function buildWhatsAppSOSLink(params: {
  phone?: string;
  incidentId: string;
  lat: number;
  lng: number;
  threatLevel: string;
  threatScore: number;
  reason: string;
  transcript?: string;
}): string {
  const mapLink = `https://www.google.com/maps?q=${params.lat},${params.lng}`;
  const text = `🚨 *EMERGENCY SOS ALERT — E.D.I.T.H.ai* 🚨
--------------------------------------
⚠️ *Threat Level:* ${params.threatLevel} (${params.threatScore}%)
📌 *Reason:* ${params.reason}
🕒 *Time:* ${new Date().toLocaleString()}
📍 *Live Location:* ${mapLink}
${params.transcript ? `\n🎙️ *Captured Audio Transcript:*\n"${params.transcript.slice(-150)}"` : ''}
--------------------------------------
*Autonomous AI Sentinel Dispatch — Immediate Response Required*`;

  const encodedText = encodeURIComponent(text);
  if (params.phone && params.phone.trim().length > 0) {
    const cleanPhone = params.phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

// Web Audio API tactical sound effects
class SoundController {
  private ctx: AudioContext | null = null;

  private getContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playBeep(freq = 800, type: OscillatorType = 'sine', duration = 0.08) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext might be restricted by browser policy
    }
  }

  playSiren() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Ignore audio restriction
    }
  }

  playSafeArmed() {
    this.playBeep(520, 'sine', 0.05);
    setTimeout(() => this.playBeep(1040, 'sine', 0.08), 70);
  }
}

export const soundEffects = new SoundController();
