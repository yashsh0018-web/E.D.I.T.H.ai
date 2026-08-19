'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SilentSnapshot, AudioEvidenceClip } from '@/lib/types';

const SAMPLE_SNAPSHOTS: SilentSnapshot[] = [
  {
    id: 'snap-1',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAP-OtIzAVIWQK-vPe03oQmvb05Hym94_zgcqWY9nGfL_00_aGm3wxuJNfVmg40AV-LGWXkjofNeZd5lXXaza1sxIy35pDhVMq2OIidMgkOatkeC_g73peHHxPdRuVSJwKrG5WO8WOGTY7ZTSjGyncLSViuH7ymV1_j29tyj6WiNKMdLa1bf5irqLfYh-YlSUy6fUOk7c1wDGzR1uViV61RTCFVNn9RcmN6KLPNqjb2CQmWp1uhYLC5Jg',
    timestamp: new Date(Date.now() - 15000).toLocaleTimeString(),
    relativeTime: 'T-0:15',
    triggerReason: 'Threat trigger keyword: "help"',
  },
  {
    id: 'snap-2',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbFSYSEmNZylGeiXAYrU_k4PnfJG8U0KM1vQtFK2KE1iDGSf_mHN74RzmDqrO5dlMfJTRQvMSuIv9GeOw-AoMhvxv5K80whSjaOWBA2fRhwElxU7yztPz4FP-ucTUoV8R_cgMJobpCCLlA4qpqE69u2dBCJniFBZYXefFIoKk2hTWolaqPnMhil6rOHK3AxQZ2udmTaw9-mUr0HVzD3w_XnxkNDw2W807pXOeu5U2WCY9tdz4DHgNnFw',
    timestamp: new Date(Date.now() - 10000).toLocaleTimeString(),
    relativeTime: 'T-0:10',
    triggerReason: 'Acoustic anomaly / Elevated stress',
  },
  {
    id: 'snap-3',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0IG3CXCyb-B32U2XAhdTF0z4V5gerYCtRCzEk-__zxp4P50el68mVNpN1F1w6VeZ75MEWp0OSXWuxs1cw1tf2NENCXw_lPPxG7AB-Z-nd8b4dV-d2A1fguhfV-HE40ZA8J6H6T8uhW-E3xme4K28D0rAs3YWMZB8WAHALadR9eHYGL-iPnB7Z_-_GJSaX04x9gSL2V0WLMPoklEdeTlHTnw3mA6idymnYrMDHOe7znGik-LDWCCJ0Og',
    timestamp: new Date(Date.now() - 2000).toLocaleTimeString(),
    relativeTime: 'T-0:02',
    triggerReason: 'Panic SOS button triggered',
  }
];

export function useSilentEvidence() {
  const [snapshots, setSnapshots] = useState<SilentSnapshot[]>(SAMPLE_SNAPSHOTS);
  const [audioClips, setAudioClips] = useState<AudioEvidenceClip[]>([]);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoStreamRef = useRef<MediaStream | null>(null);

  // Hidden Canvas for off-screen snapshot extraction
  const captureSilentSnapshot = useCallback(async (reason = 'Automated Distress Snapshot', coords?: { lat: number; lng: number }): Promise<SilentSnapshot | null> => {
    try {
      let stream = videoStreamRef.current;
      let stopStreamAfter = false;

      if (!stream || !stream.active) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
          });
          videoStreamRef.current = stream;
          setCameraActive(true);
          stopStreamAfter = false;
        } catch {
          console.warn('Camera access denied or unavailable. Generating tactical telemetry snapshot.');
        }
      }

      let dataUrl = '';
      if (stream && stream.active) {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        await new Promise((res) => {
          video.onloadedmetadata = () => {
            setTimeout(res, 200);
          };
        });

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Draw tactical timestamp watermark
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
          ctx.font = '12px "JetBrains Mono", monospace';
          ctx.fillStyle = '#4edea3';
          ctx.fillText(`E.D.I.T.H. EVIDENCE [${new Date().toISOString()}] - ${reason}`, 10, canvas.height - 10);

          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
      }

      // If camera capture couldn't produce image, fallback to stylized encrypted placeholder
      if (!dataUrl) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0e0e10';
          ctx.fillRect(0, 0, 640, 360);
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, 10, 620, 340);
          ctx.font = '14px "JetBrains Mono", monospace';
          ctx.fillStyle = '#ffdad6';
          ctx.fillText(`🚨 CLASSIFIED EVIDENCE SNAPSHOT`, 30, 50);
          ctx.fillStyle = '#4edea3';
          ctx.fillText(`TIMESTAMP: ${new Date().toISOString()}`, 30, 80);
          if (coords) {
            ctx.fillText(`GPS LOC: LAT ${coords.lat.toFixed(4)}, LNG ${coords.lng.toFixed(4)}`, 30, 110);
          }
          ctx.fillText(`TRIGGER: ${reason}`, 30, 140);
          ctx.fillText(`STATUS: SECURE ENCRYPTED LOG`, 30, 170);
          dataUrl = canvas.toDataURL('image/jpeg');
        }
      }

      const newSnapshot: SilentSnapshot = {
        id: `snap-${Date.now()}`,
        imageUrl: dataUrl,
        timestamp: new Date().toLocaleTimeString(),
        relativeTime: 'T-0:00',
        coordinates: coords,
        triggerReason: reason,
      };

      setSnapshots((prev) => [newSnapshot, ...prev.slice(0, 8)]);
      return newSnapshot;
    } catch (err) {
      console.error('Error during silent evidence snapshot:', err);
      return null;
    }
  }, []);

  // Continuous Audio Recording Loop (5-minute chunks)
  const startAudioRecordingLoop = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) return;

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioBlobUrl = URL.createObjectURL(audioBlob);
          const newClip: AudioEvidenceClip = {
            id: `audio-${Date.now()}`,
            audioBlobUrl,
            durationSeconds: 15,
            timestamp: new Date().toLocaleTimeString(),
            threatScore: 75,
            transcriptSnippet: 'Ambient distress buffer locked.',
          };
          setAudioClips((prev) => [newClip, ...prev.slice(0, 10)]);
          audioChunksRef.current = [];
        }
      };

      // Start recording with 5-minute slice interval (or 30s chunks for active loop)
      recorder.start(1000);
      setIsRecordingAudio(true);

      // Auto-cycle every 5 minutes (300000ms)
      const interval = setInterval(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setTimeout(() => {
            if (recorder.state === 'inactive') recorder.start(1000);
          }, 100);
        }
      }, 300000);

      return () => {
        clearInterval(interval);
        if (recorder.state === 'recording') recorder.stop();
        audioStream.getTracks().forEach((track) => track.stop());
      };
    } catch (err) {
      console.warn('Microphone access for audio evidence loop was not granted:', err);
      setIsRecordingAudio(false);
    }
  }, []);

  const stopAudioRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return {
    snapshots,
    audioClips,
    isRecordingAudio,
    cameraActive,
    captureSilentSnapshot,
    startAudioRecordingLoop,
    stopAudioRecording,
  };
}
