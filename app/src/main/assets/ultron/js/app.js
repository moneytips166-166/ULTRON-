import { stateManager } from './core/state-manager.js';
import { bus } from './core/event-bus.js';
import { ParticleEngine } from './graphics/particle-engine.js';
import { CameraManager } from './vision/camera-manager.js';
import { HandTracker } from './vision/hand-tracker.js';
import { speechRecognition } from './voice/speech-recognition.js';
import { speechOutput } from './voice/speech-output.js';
import { chatManager } from './assistant/chat-manager.js';
import { HudManager } from './ui/hud-manager.js';

/**
 * Main Application Orchestrator
 */
class UltronApp {
  constructor() {
    this.particleEngine = null;
    this.cameraManager = null;
    this.handTracker = null;
    this.hudManager = null;
  }

  async init() {
    console.log('[ULTRON] Initializing Cybernetic Core...');

    // 1. Initialize Particle Engine
    const canvasContainer = document.getElementById('canvas-container');
    this.particleEngine = new ParticleEngine(canvasContainer);

    // 2. Initialize Camera & Vision
    const video = document.getElementById('camera-video');
    const previewCanvas = document.getElementById('camera-preview');
    this.cameraManager = new CameraManager(video);
    this.handTracker = new HandTracker(video, previewCanvas);

    // 3. Connect Vision requests
    bus.on('requestStartCamera', async () => {
      const ok = await this.cameraManager.startCamera();
      if (ok) {
        this.handTracker.start();
      }
    });

    bus.on('requestStopCamera', () => {
      this.handTracker.stop();
      this.cameraManager.stopCamera();
    });

    bus.on('cameraStopped', () => {
      this.handTracker.stop();
    });

    // 4. Initialize HUD UI
    this.hudManager = new HudManager();

    // 5. Initial Audio Greeting
    setTimeout(() => {
      speechOutput.speak('Ultron online. Systems nominal.');
    }, 1000);

    console.log('[ULTRON] Systems Online and Nominal.');
  }
}

// Bootstrap when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new UltronApp();
  app.init();
});
