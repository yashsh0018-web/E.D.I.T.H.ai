import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EDITH_SYSTEM_PROMPT } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        {
          threat_detected: false,
          risk_score: 0,
          intent: 'Benign Conversation',
          reasoning: 'No valid acoustic transcript received.',
          suggested_action: 'MONITOR_PASSIVE',
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Call Gemini 1.5 Flash if valid API key is present
    if (apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.length > 10) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `${EDITH_SYSTEM_PROMPT}

### AMBIENT TRANSCRIPT TO EVALUATE:
"${transcript}"`;

        const result = await model.generateContent(prompt);
        const rawText = result.response.text().trim();

        let cleanJson = rawText;
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
        }

        const parsed = JSON.parse(cleanJson);
        const risk_score = typeof parsed.risk_score === 'number' ? parsed.risk_score : (parsed.threat_detected ? 85 : 10);
        const threat_detected = Boolean(parsed.threat_detected || risk_score >= 60);
        const suggested_action = parsed.suggested_action || (risk_score >= 70 ? 'ESCALATE_SOS' : (risk_score >= 40 ? 'SILENT_RECORD' : 'MONITOR_PASSIVE'));

        return NextResponse.json({
          threat_detected,
          risk_score,
          intent: String(parsed.intent || 'Ambient Context'),
          reasoning: String(parsed.reasoning || 'Contextual evaluation complete.'),
          suggested_action,
        });
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to local heuristic analyzer:', geminiErr);
      }
    }

    // Heuristic Contextual Analyzer Fallback (Matches exact prompt guidelines)
    const lower = transcript.toLowerCase();
    const immediateKeywords = [
      'wrong way',
      'stop the car',
      'bhaiya ruko',
      'don\'t touch me',
      'dont touch me',
      'chodo',
      'help',
      'bachao',
      'code red',
      'leave me',
      'let me go',
      'save me',
      'police',
      'chup raho',
      'mat karo',
    ];

    const matchedImmediate = immediateKeywords.filter((kw) => lower.includes(kw));

    if (matchedImmediate.length > 0) {
      const risk_score = Math.min(100, 80 + matchedImmediate.length * 5);
      return NextResponse.json({
        threat_detected: true,
        risk_score,
        intent: lower.includes('wrong way') || lower.includes('stop the car') || lower.includes('bhaiya ruko')
          ? 'Route Deviation Panic'
          : lower.includes('don\'t touch') || lower.includes('chodo')
          ? 'Physical Threat / Coercion'
          : 'Immediate Distress Call',
        reasoning: `High-risk distress triggers identified: [${matchedImmediate.join(', ')}] during ambient voice surveillance.`,
        suggested_action: 'ESCALATE_SOS',
      });
    }

    const subtleKeywords = ['scared', 'who are you', 'weird', 'dark', 'dar lag raha hai', 'follow'];
    const matchedSubtle = subtleKeywords.filter((kw) => lower.includes(kw));

    if (matchedSubtle.length > 0) {
      return NextResponse.json({
        threat_detected: false,
        risk_score: 45,
        intent: 'Contextual Tension / Suspicion',
        reasoning: `Subtle apprehension cues detected in speech: [${matchedSubtle.join(', ')}].`,
        suggested_action: 'SILENT_RECORD',
      });
    }

    return NextResponse.json({
      threat_detected: false,
      risk_score: 5,
      intent: 'Benign Conversation',
      reasoning: 'Everyday ambient conversation patterns detected. No distress markers present.',
      suggested_action: 'MONITOR_PASSIVE',
    });
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    return NextResponse.json(
      {
        threat_detected: false,
        risk_score: 0,
        intent: 'Benign Conversation',
        reasoning: 'Internal telemetry parse error.',
        suggested_action: 'MONITOR_PASSIVE',
      },
      { status: 500 }
    );
  }
}
