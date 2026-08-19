'use client';

import React, { useState, useEffect } from 'react';
import { useSafety } from '@/lib/safety-context';
import {
  AlertTriangle,
  PhoneCall,
  Share2,
  XCircle,
  MapPin,
  Clock,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { formatCoordinates } from '@/lib/utils';

export default function SOSModal() {
  const {
    isSOSModalOpen,
    setIsSOSModalOpen,
    threatScore,
    lastTriggerReason,
    geo,
    resolveEmergency,
    dispatchWhatsAppSOS,
    emergencyContacts,
    incidentId,
  } = useSafety();

  const [countdown, setCountdown] = useState(5);
  const [isAutoDispatched, setIsAutoDispatched] = useState(false);
  const [cancelPin, setCancelPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  useEffect(() => {
    if (!isSOSModalOpen) {
      setCountdown(5);
      setIsAutoDispatched(false);
      setShowPinInput(false);
      setCancelPin('');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isAutoDispatched) {
            setIsAutoDispatched(true);
            dispatchWhatsAppSOS();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatchWhatsAppSOS, isAutoDispatched, isSOSModalOpen]);

  if (!isSOSModalOpen) return null;

  const { latStr, lngStr } = formatCoordinates(geo.lat, geo.lng);

  const handleCancel = () => {
    // Allows instant cancellation or optional PIN confirmation
    resolveEmergency();
    setIsSOSModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      {/* Ambient Pulsing Emergency Glow */}
      <div className="absolute inset-0 bg-primary-container/20 animate-pulse pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-2xl bg-surface-container-low border-2 border-primary-container p-6 flex flex-col gap-5 shadow-[0_0_60px_rgba(220,38,38,0.6)] z-10">
        {/* Header Alert Title */}
        <div className="flex items-center justify-between border-b border-primary/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-bounce">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-mono text-lg sm:text-xl font-black text-primary tracking-wider uppercase">
                EMERGENCY SOS ARMED
              </h2>
              <span className="font-mono text-xs text-on-surface-variant">
                Incident ID: {incidentId} • Threat: {threatScore}%
              </span>
            </div>
          </div>

          {countdown > 0 && (
            <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center font-mono text-sm font-bold text-primary animate-pulse">
              {countdown}s
            </div>
          )}
        </div>

        {/* Threat Reason & Live GPS Box */}
        <div className="rounded-xl bg-surface-container-lowest p-3.5 border border-primary/30 flex flex-col gap-2 font-mono text-xs">
          <div className="flex items-start gap-2 text-primary font-bold">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{lastTriggerReason}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-secondary" />
              <span className="text-on-surface font-semibold">{latStr}, {lngStr}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Primary Action: Instant WhatsApp Emergency Dispatch */}
        <button
          onClick={() => dispatchWhatsAppSOS()}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-secondary text-on-secondary-container font-mono text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(78,222,163,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Send className="w-5 h-5" />
          <span>Launch WhatsApp SOS Alert</span>
        </button>

        {/* Emergency Contacts Direct Dispatch List */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider flex items-center gap-1">
            <Share2 className="w-3 h-3 text-secondary" /> Direct Contact Dispatch
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {emergencyContacts.slice(0, 2).map((contact) => (
              <button
                key={contact.id}
                onClick={() => dispatchWhatsAppSOS(contact.phone)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-white/10 text-left transition-colors"
              >
                <div className="flex flex-col truncate">
                  <span className="font-mono text-xs font-semibold text-on-surface truncate">
                    {contact.name}
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant truncate">
                    {contact.phone}
                  </span>
                </div>
                <PhoneCall className="w-4 h-4 text-secondary flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>

        {/* Cancel / De-escalate Button */}
        <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
          <button
            onClick={handleCancel}
            className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/10 font-mono text-xs text-on-surface-variant hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4 text-secondary" />
            <span>Cancel / False Alarm (I Am Safe)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
