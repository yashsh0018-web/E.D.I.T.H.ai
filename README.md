# 🛡️ E.D.I.T.H.ai — AI-Powered Autonomous Personal Safety Companion
> *"Even Distressed, I Trigger Help"*

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash-8E75B2?style=for-the-badge&logo=google)
![Three.js](https://img.shields.io/badge/Three.js-Visualizer-000000?style=for-the-badge&logo=three.js)

**E.D.I.T.H.ai** is an autonomous personal safety web app designed for discreet threat detection, real-time dual-device synchronization, and instant emergency dispatching during harassment, transit deviation, or kidnapping scenarios.

---

## 🌟 Key Features

### 1. 🎙️ Dual-Layer Acoustic Threat Engine
* **Layer 1 (Instant Local Hotwords):** Evaluates speech locally without network latency (`"help"`, `"bachao"`, `"wrong way"`, `"stop the car"`, `"bhaiya ruko"`, `"code red"`).
* **Layer 2 (Gemini 1.5 Flash Analyzer):** Evaluates rolling ambient conversation transcripts for subtle coercion, unauthorized transit route deviations, and harassment.

### 2. 📱 Phone Client Sentinel Mode (`/`)
* **One-Click Safety Shield:** Arms Microphone, Covert Camera pipeline, and GNSS Geolocation.
* **Silent Canvas Camera Snapshots:** Covertly captures forensic frames from hidden video stream.
* **Stealth Camouflage Modes:** Disguises the screen as **Workspace Notes** or a **Fake Phone Call from Mom** while ambient microphone surveillance continues in the background.

### 3. 💻 Guardian Command Center (`/command-center`)
* **Real-Time Emergency Bridge:** Connects to `/api/emergency` and `/api/stream` with zero-database overhead.
* **Loud Web Audio Emergency Siren:** Sweeping dual-frequency alarm tone (800Hz $\leftrightarrow$ 1250Hz).
* **Live Tactical GNSS Radar Map:** Centers on incoming victim coordinates with glowing radar ping.
* **Covert Evidence Locker:** Renders silent camera snapshots, audio recordings, and linguistic intent breakdowns.
* **1-Click Police / WhatsApp SOS Dispatch:** Pre-formatted emergency WhatsApp payload with Google Maps link.

---

## 🚀 Getting Started

### Local Development
```bash
# Install dependencies
npm install

# Start development server bound to LAN for mobile access
npm run dev
# or
npx next dev -H 0.0.0.0 -p 3000
```

### Environment Variables
Create a `.env.local` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: If `GEMINI_API_KEY` is not provided, the app automatically runs on the high-accuracy local heuristic analyzer)*

---

## 📱 Live Dual-Device Demo

1. **Laptop:** Open `http://localhost:3000/command-center` and click **"Arm Guardian System"**.
2. **Phone:** Open `http://<YOUR_LAPTOP_IP>:3000/` and click **"Start Safety Shield"**.
3. **Trigger:** Speak *"Bhaiya ruko, you are taking the wrong way!"* into the phone.
4. **Result:** The laptop blares the emergency siren, displays the silent photo snapshot, and pins the live GPS location on the map in real time!
