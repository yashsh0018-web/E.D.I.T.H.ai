'use client';

import React from 'react';
import { useSafety } from '@/lib/safety-context';
import { Navigation, MapPin, RefreshCw, ExternalLink } from 'lucide-react';
import { formatCoordinates } from '@/lib/utils';

export default function LiveTelemetryCard() {
  const { geo } = useSafety();
  const { latStr, lngStr } = formatCoordinates(geo.lat, geo.lng);

  const googleMapsUrl = `https://www.google.com/maps?q=${geo.lat},${geo.lng}`;

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col justify-between gap-3 relative overflow-hidden group min-h-[140px]">
      {/* High-tech tactical dark satellite map preview */}
      <div
        className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity bg-cover bg-center"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAmE8SFecUvLMisr1onInpiH3QkCMg87wyAP0dirSEDO-UFspwj1iIQ6a068FpjzqrBjWowcpqD3q7aqhJ3vTdTkgo7Ehg4XfmS-IXePL4tldu5bv8-DI_8GiiE4SdFpV8b5fsYG7KLIWxIPQaXevupTe-OfRC026cEVgvAp_iXqfTW8L5iRCnifVDIbxwwtnJD5IzK4Si46WX67XBPE2TCPL_dNVPcpP64CIlQmQwlvHO07adDABqF7A')`,
        }}
      />
      {/* Radial overlay for cyber contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/60 to-transparent pointer-events-none" />

      {/* Header Row */}
      <div className="relative z-10 flex justify-between items-start">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Navigation className="w-4 h-4 text-secondary animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-wider font-semibold">
            Live GPS Telemetry
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={geo.refreshLocation}
            title="Refresh GPS Coordinates"
            className="p-1 rounded bg-surface-container-high/80 hover:bg-surface-container text-on-surface-variant hover:text-secondary border border-white/5 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
          </button>

          <span
            className={`px-2 py-0.5 font-mono text-[10px] rounded border ${
              geo.isLocked
                ? 'bg-secondary/15 text-secondary border-secondary/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}
          >
            {geo.isLocked ? 'GPS LOCKED' : 'APPROXIMATE'}
          </span>
        </div>
      </div>

      {/* Live Coordinates & Map Link */}
      <div className="relative z-10 flex justify-between items-end mt-2 pt-2 border-t border-white/5">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs font-semibold text-on-surface flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-secondary" /> {latStr}
          </span>
          <span className="font-mono text-xs font-semibold text-on-surface ml-5">
            {lngStr}
          </span>
          <span className="font-mono text-[10px] text-on-surface-variant/70 ml-5">
            Accuracy: ±{Math.round(geo.accuracy || 8)}m • Updated: {geo.lastUpdated}
          </span>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-variant text-xs font-mono text-secondary hover:text-white border border-secondary/20 transition-colors shadow-sm"
        >
          <span>Map</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
