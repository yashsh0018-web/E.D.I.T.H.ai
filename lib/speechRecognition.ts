'use client';

// Layer 1: Instant Local Hotwords
export const LOCAL_HOTWORDS = [
  'help',
  'bachao',
  'leave me',
  'wrong way',
  'ruko',
  'stop the car',
  'bhaiya ruko',
  'don\'t touch me',
  'dont touch me',
  'chodo',
  'code red',
  'stop',
  'let me go',
  'save me',
  'police',
  'danger',
];

export interface GeminiAnalysisResponse {
  threat_detected: boolean;
  risk_score: number; // 0 to 100
  intent: string;
  reasoning: string;
  suggested_action?: 'MONITOR_PASSIVE' | 'SILENT_RECORD' | 'ESCALATE_SOS';
}

export type OnHotwordMatch = (keyword: string, fullTranscript: string) => void;
export type OnGeminiResult = (result: GeminiAnalysisResponse) => void;

interface ExtendedWindow extends Window {
  SpeechRecognition?: any; // eslint-disable-line
  webkitSpeechRecognition?: any; // eslint-disable-line
}

export class AmbientSpeechEngine {
  private recognition: any = null; // eslint-disable-line
  private isRunning: boolean = false;
  private fullTranscript: string = '';
  private interimTranscript: string = '';
  private onHotword: OnHotwordMatch | null = null;
  private onGemini: OnGeminiResult | null = null;
  private onTranscriptUpdate: ((transcript: string, interim: string) => void) | null = null;
  private geminiIntervalTimer: NodeJS.Timeout | null = null;
  private lastAnalyzedSlice: string = '';

  constructor(
    onHotword?: OnHotwordMatch,
    onGemini?: OnGeminiResult,
    onTranscriptUpdate?: (transcript: string, interim: string) => void
  ) {
    if (onHotword) this.onHotword = onHotword;
    if (onGemini) this.onGemini = onGemini;
    if (onTranscriptUpdate) this.onTranscriptUpdate = onTranscriptUpdate;
  }

  public init() {
    if (typeof window === 'undefined') return;

    const extWindow = window as unknown as ExtendedWindow;
    const SpeechRecognition = extWindow.SpeechRecognition || extWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser context.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => { // eslint-disable-line
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += piece + ' ';
          } else {
            interim += piece;
          }
        }

        if (interim) {
          this.interimTranscript = interim;
          this.checkInstantHotwords(interim);
        }

        if (final) {
          this.fullTranscript = (this.fullTranscript + ' ' + final).trim();
          this.checkInstantHotwords(this.fullTranscript);
          this.interimTranscript = '';
        }

        if (this.onTranscriptUpdate) {
          this.onTranscriptUpdate(this.fullTranscript, this.interimTranscript);
        }
      };

      this.recognition.onerror = (event: any) => { // eslint-disable-line
        console.warn('SpeechRecognition event status:', event.error);
      };

      this.recognition.onend = () => {
        if (this.isRunning && this.recognition) {
          try {
            this.recognition.start();
          } catch {
            // Already active
          }
        }
      };
    } catch (e) {
      console.warn('Error setting up SpeechRecognition:', e);
    }
  }

  public start() {
    this.isRunning = true;
    if (!this.recognition) this.init();

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch {
        // Active
      }
    }

    // Layer 2: Periodic Gemini Flash Transcript Analysis (Every 8-10 seconds)
    if (!this.geminiIntervalTimer) {
      this.geminiIntervalTimer = setInterval(() => {
        this.sendPeriodicGeminiAnalysis();
      }, 9000);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.geminiIntervalTimer) {
      clearInterval(this.geminiIntervalTimer);
      this.geminiIntervalTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Stop
      }
    }
  }

  private checkInstantHotwords(text: string) {
    const lower = text.toLowerCase();
    for (const hotword of LOCAL_HOTWORDS) {
      if (lower.includes(hotword)) {
        if (this.onHotword) {
          this.onHotword(hotword, text);
        }
        break;
      }
    }
  }

  public async sendPeriodicGeminiAnalysis(forcedText?: string) {
    const textChunk = (forcedText || this.fullTranscript || this.interimTranscript).trim();
    if (!textChunk || textChunk.length < 3) return;
    if (textChunk === this.lastAnalyzedSlice) return;
    this.lastAnalyzedSlice = textChunk;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textChunk.slice(-350),
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result: GeminiAnalysisResponse = await response.json();
        if (this.onGemini) {
          this.onGemini(result);
        }
      }
    } catch (err) {
      console.warn('Gemini analysis fetch error:', err);
    }
  }

  public simulatePhrase(phrase: string) {
    this.fullTranscript = `${this.fullTranscript} [Simulated] "${phrase}"`;
    if (this.onTranscriptUpdate) {
      this.onTranscriptUpdate(this.fullTranscript, '');
    }
    this.checkInstantHotwords(phrase);
    this.sendPeriodicGeminiAnalysis(phrase);
  }

  public getFullTranscript() {
    return this.fullTranscript;
  }
}
