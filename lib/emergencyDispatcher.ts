'use client';

export interface EmergencyContactInfo {
  name: string;
  phone: string;
}

export interface VaultEvidenceItem {
  id: string;
  timestamp: string;
  coordinates: {
    lat: number;
    lng: number;
    mapsUrl: string;
  };
  reason: string;
  transcriptSnippet: string;
  photoBase64?: string;
  audioBlobUrl?: string;
  riskScore: number;
}

const STORAGE_KEY_CONTACT = 'auraguard_emergency_contact';
const STORAGE_KEY_VAULT = 'auraguard_vault_items';

export function getStoredEmergencyContact(): EmergencyContactInfo {
  if (typeof window === 'undefined') return { name: 'Emergency Guardian', phone: '+919876543210' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONTACT);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return { name: 'Emergency Guardian', phone: '+919876543210' };
}

export function saveEmergencyContact(contact: EmergencyContactInfo) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CONTACT, JSON.stringify(contact));
  } catch (e) {
    console.warn('Failed saving contact to localStorage', e);
  }
}

export function getStoredVaultItems(): VaultEvidenceItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VAULT);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

export function saveVaultItem(item: VaultEvidenceItem) {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredVaultItems();
    const updated = [item, ...current.slice(0, 19)];
    localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed saving vault item to localStorage', e);
  }
}

// Live GPS coordinate extraction with Google Maps Link
export async function getLiveGPSCoordinates(): Promise<{ lat: number; lng: number; mapsUrl: string }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve({
        lat: 34.0522,
        lng: -118.2437,
        mapsUrl: 'https://maps.google.com/?q=34.0522,-118.2437',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        resolve({
          lat,
          lng,
          mapsUrl: `https://maps.google.com/?q=${lat},${lng}`,
        });
      },
      (err) => {
        console.warn('GPS location fallback:', err.message);
        resolve({
          lat: 34.0522,
          lng: -118.2437,
          mapsUrl: 'https://maps.google.com/?q=34.0522,-118.2437',
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// Silent Offscreen Camera Snapshot
export async function captureSilentCameraSnapshot(): Promise<string | undefined> {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return undefined;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });

    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();

    // Small delay to ensure frame is loaded
    await new Promise((res) => setTimeout(res, 250));

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Add subtle watermark
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#4edea3';
      ctx.fillText(`AURA GUARD EVIDENCE CAPTURE — ${new Date().toISOString()}`, 8, canvas.height - 8);
    }

    // Stop camera stream tracks immediately
    stream.getTracks().forEach((track) => track.stop());

    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (err) {
    console.warn('Camera snapshot not permitted or unavailable:', err);
    return undefined;
  }
}

// Pre-composed WhatsApp Dispatch Link Generator
export function generateWhatsAppSOSPayload(params: {
  phone: string;
  lat: number;
  lng: number;
  mapsUrl: string;
  reason: string;
  timestamp: string;
}): string {
  const cleanPhone = params.phone.replace(/[^0-9]/g, '');
  const message = `🚨 AURA GUARD ALERT! User is in distress. Coordinates: [${params.lat.toFixed(4)}, ${params.lng.toFixed(4)}] | Map: ${params.mapsUrl} | Reason: [${params.reason}] | Time: [${params.timestamp}]`;
  const encoded = encodeURIComponent(message);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
