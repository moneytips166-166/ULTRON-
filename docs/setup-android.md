# ULTRON — Setup & Android Deployment Guide

## 1. Overview
ULTRON is an Android-compatible 3D Gesture & Voice Intelligence application featuring:
- Real-time Three.js WebGL volumetric particle energy core.
- MediaPipe Hand Landmarker for real-time open-palm expansion and closed-fist contraction.
- Local voice command parser & multi-provider AI assistant (Gemini, OpenAI, Claude, Groq, DeepSeek).
- Android native APK embedding with hardware-accelerated WebView, camera/mic permissions, and speech bridging.

---

## 2. Running in Android APK
The project builds natively into an Android APK. The APK automatically:
1. Grants camera and microphone permissions via Jetpack Compose and `WebChromeClient`.
2. Hardware-accelerates WebGL rendering with additive blending and depth attenuation.
3. Injects Gemini API keys from AI Studio secrets via `BuildConfig.GEMINI_API_KEY`.
4. Bridges native Android `SpeechRecognizer` and `TextToSpeech` into the JavaScript engine.

---

## 3. Running via Termux on Android Phone
To develop or run as a standalone PWA on an Android phone using Termux:

1. **Install Node.js & Git in Termux**:
   ```bash
   pkg update && pkg install -y nodejs git
   ```

2. **Navigate to the Applet Web Directory**:
   ```bash
   cd app/src/main/assets/ultron
   ```

3. **Start a Local HTTP / HTTPS Server**:
   ```bash
   npx serve -l 8080 -s .
   ```
   *Note: For camera and microphone access outside `localhost`, use HTTPS or Chrome's `chrome://flags/#unsafely-treat-insecure-origin-as-secure` pointing to `http://localhost:8080`.*

4. **Open in Chrome on Android**:
   - Navigate to `http://localhost:8080`
   - Tap Chrome menu -> **"Add to Home screen" / "Install app"** to install ULTRON as a native-like PWA.
