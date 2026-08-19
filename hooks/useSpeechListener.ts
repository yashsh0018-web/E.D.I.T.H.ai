'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ThreatAnalysisResult } from '@/lib/types';

interface UseSpeechListenerProps {
  onInstantLocalTrigger?: (keyword: string, transcript: string) => void;
  onGeminiAnalysis?: (analysis: ThreatAnalysisResult) => void;
  enabled?: boolean;
}

interface ExtendedSpeechWindow extends Window {
  SpeechRecognition?: any; // eslint-disable-line
  webkitSpeechRecognition?: any; // eslint-disable-line
}

export function useSpeechListener({
  onInstantLocalTrigger,
  onGeminiAnalysis,
  enabled = true,
}: UseSpeechListenerProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(16).fill(5));
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null); // eslint-disable-line
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastAnalyzedTranscriptRef = useRef<string>('');

  const CRITICAL_LOCAL_TRIGGERS = [
    'help', 'bachao', 'stop', 'code red', 'police', 'save me', 
    'let me go', 'danger', 'mat karo', 'door raho', 'emergency',
    'leave me alone', 'leave me', 'wrong way', 'stop the car', 'edith trigger', 'chodo mujhe'
  ];

  // Send to /api/analyze for Gemini Flash analysis
  const sendToGeminiAnalysis = useCallback(async (textToAnalyze: string) => {
    if (!textToAnalyze || textToAnalyze.trim().length < 3) return;
    if (textToAnalyze === lastAnalyzedTranscriptRef.current) return;
    lastAnalyzedTranscriptRef.current = textToAnalyze;

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textToAnalyze,
          audioContext: {
            timestamp: new Date().toISOString(),
            ambientDecibels: 68,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (onGeminiAnalysis) {
          onGeminiAnalysis({
            threatScore: data.risk_score || 0,
            threatLevel: data.threat_detected || (data.risk_score > 70) ? 'CRITICAL' : (data.risk_score > 30 ? 'ELEVATED' : 'SAFE'),
            dangerKeywords: [],
            coercionDetected: data.intent?.toLowerCase().includes('coercion') || false,
            sentiment: data.intent || 'Ambient',
            summary: data.reasoning || '',
            recommendedAction: data.risk_score > 70 ? 'Immediate WhatsApp SOS dispatch' : 'Continuous monitoring',
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Error during Gemini speech analysis call:', err);
    }
  }, [onGeminiAnalysis]);

  // Check instant local triggers
  const evaluateLocalTriggers = useCallback((currentText: string) => {
    const lower = currentText.toLowerCase();
    for (const keyword of CRITICAL_LOCAL_TRIGGERS) {
      if (lower.includes(keyword)) {
        if (onInstantLocalTrigger) {
          onInstantLocalTrigger(keyword, currentText);
        }
        break;
      }
    }
  }, [onInstantLocalTrigger]);

  // Audio level visualizer stream
  const startAudioAnalyzer = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        const bars: number[] = [];
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i] || 0;
          sum += val;
          bars.push(Math.max(4, Math.round((val / 255) * 32)));
        }

        const avg = sum / 16;
        setAudioLevel(Math.min(100, Math.round((avg / 255) * 100)));
        setFrequencyData(bars);

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.warn('Audio analyzer access denied or unavailable:', err);
    }
  }, []);

  // Web Speech API continuous recognition
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const extWindow = window as unknown as ExtendedSpeechWindow;
    const SpeechRecognition = extWindow.SpeechRecognition || extWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser.');
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => { // eslint-disable-line
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptPiece + ' ';
          } else {
            interim += transcriptPiece;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
          evaluateLocalTriggers(interim);
        }

        if (final) {
          setTranscript((prev) => {
            const updated = (prev + ' ' + final).trim();
            evaluateLocalTriggers(updated);
            sendToGeminiAnalysis(updated.slice(-200));
            return updated;
          });
          setInterimTranscript('');
        }
      };

      recognition.onerror = (event: any) => { // eslint-disable-line
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (enabled && recognitionRef.current) {
          try {
            recognition.start();
          } catch {
            // Already started or suspended
          }
        }
      };

      recognition.start();
      setIsListening(true);
      startAudioAnalyzer();
    } catch (err) {
      console.warn('Could not start SpeechRecognition:', err);
    }
  }, [enabled, evaluateLocalTriggers, sendToGeminiAnalysis, startAudioAnalyzer]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignored
      }
      recognitionRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
  }, []);

  const simulateTriggerWord = useCallback((simulatedPhrase: string) => {
    setTranscript((prev) => `${prev} [Simulated] "${simulatedPhrase}"`);
    evaluateLocalTriggers(simulatedPhrase);
    sendToGeminiAnalysis(simulatedPhrase);
  }, [evaluateLocalTriggers, sendToGeminiAnalysis]);

  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [enabled, startListening, stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    audioLevel,
    frequencyData,
    speechSupported,
    startListening,
    stopListening,
    simulateTriggerWord,
    setTranscript,
  };
}
