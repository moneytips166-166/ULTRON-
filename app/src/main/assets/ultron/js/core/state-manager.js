import { CONFIG } from '../config.js';
import { bus } from './event-bus.js';

/**
 * StateManager: Single Source of Truth for Ultron Engine
 */
class StateManager {
  constructor() {
    this.state = {
      mode: CONFIG.defaultMode, // 'normal' | 'hand'
      currentColor: 'cyan',
      currentShape: 'sphere',
      quality: 'BALANCED',
      
      // Dynamic motion & scaling
      expansion: 1.0,         // Target scale: 0.42 (fist) -> 1.0 (neutral) -> 1.85 (open palm)
      targetPos: { x: 0, y: 0, z: 0 },
      targetRot: { x: 0, y: 0, z: 0 },
      glowIntensity: 1.0,
      pulseActive: false,
      pulseStartTime: 0,
      
      // Hand Gesture telemetry
      gesture: {
        hasHand: false,
        openness: 0.5,         // 0.0 (fist) to 1.0 (open palm)
        gestureType: 'neutral', // 'fist' | 'open_palm' | 'neutral'
        confidence: 0,
        rawX: 0,
        rawY: 0,
        rawZ: 0
      },

      // Voice recognition & synthesis
      voice: {
        isListening: false,
        isSpeaking: false,
        lastTranscript: '',
        acknowledgment: 'Ultron Online. Ready for commands.'
      },

      // Active AI Configuration
      ai: {
        provider: 'gemini',
        model: CONFIG.aiProviders.gemini.defaultModel,
        apiKey: '',
        customEndpoint: '',
        isResponding: false,
        systemPrompt: 'You are ULTRON, a sophisticated futuristic cybernetic AI energy intelligence. Respond succinctly, authoritatively, and with precision. Keep responses concise and scannable.'
      },

      // Performance Diagnostics
      diagnostics: {
        fps: 60,
        frameTime: 16.6,
        particleCount: CONFIG.qualityPresets.BALANCED.count,
        visionFps: 0,
        cameraActive: false
      }
    };

    // Load persisted settings
    this.loadSavedSettings();
  }

  loadSavedSettings() {
    try {
      const savedAi = localStorage.getItem('ultron_ai_config');
      if (savedAi) {
        const parsed = JSON.parse(savedAi);
        this.state.ai = { ...this.state.ai, ...parsed };
      }
      const savedQuality = localStorage.getItem('ultron_quality');
      if (savedQuality && CONFIG.qualityPresets[savedQuality]) {
        this.state.quality = savedQuality;
        this.state.diagnostics.particleCount = CONFIG.qualityPresets[savedQuality].count;
      }
    } catch (e) {
      console.warn('Could not load saved settings from localStorage:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('ultron_ai_config', JSON.stringify({
        provider: this.state.ai.provider,
        model: this.state.ai.model,
        apiKey: this.state.ai.apiKey,
        customEndpoint: this.state.ai.customEndpoint
      }));
      localStorage.setItem('ultron_quality', this.state.quality);
    } catch (e) {
      console.warn('Could not persist settings:', e);
    }
  }

  setMode(mode) {
    if (this.state.mode !== mode) {
      this.state.mode = mode;
      bus.emit('modeChanged', mode);
      if (mode === 'normal') {
        // Reset target position
        this.state.targetPos = { x: 0, y: 0, z: 0 };
        this.state.expansion = 1.0;
      }
    }
  }

  setColor(colorName) {
    const key = colorName.toLowerCase().trim();
    if (CONFIG.colors[key]) {
      this.state.currentColor = key;
      bus.emit('colorChanged', { name: key, ...CONFIG.colors[key] });
      return true;
    }
    return false;
  }

  setShape(shapeName) {
    this.state.currentShape = shapeName;
    bus.emit('shapeChanged', shapeName);
  }

  setQuality(presetKey) {
    if (CONFIG.qualityPresets[presetKey]) {
      this.state.quality = presetKey;
      this.state.diagnostics.particleCount = CONFIG.qualityPresets[presetKey].count;
      this.saveSettings();
      bus.emit('qualityChanged', presetKey);
    }
  }

  triggerPulse() {
    this.state.pulseActive = true;
    this.state.pulseStartTime = performance.now();
    bus.emit('pulseTriggered', { time: this.state.pulseStartTime });
    setTimeout(() => {
      this.state.pulseActive = false;
    }, 1200);
  }

  updateGestureData(data) {
    this.state.gesture = { ...this.state.gesture, ...data };
    
    // In hand mode, map openness to expansion scale
    if (this.state.mode === 'hand' && data.hasHand) {
      // Map 0.0 -> fistRadiusScale (0.42), 1.0 -> openPalmRadiusScale (1.85)
      const minScale = CONFIG.sphere.fistRadiusScale;
      const maxScale = CONFIG.sphere.openPalmRadiusScale;
      this.state.expansion = minScale + (data.openness * (maxScale - minScale));

      // Map palm position (rawX -0.5 to 0.5, rawY -0.5 to 0.5) to scene coordinates
      this.state.targetPos = {
        x: data.rawX * CONFIG.gestures.positionSensitivity,
        y: -data.rawY * CONFIG.gestures.positionSensitivity,
        z: (data.rawZ || 0) * 0.8
      };

      if (data.tiltX !== undefined) {
        this.state.targetRot = {
          x: data.tiltY || 0,
          y: data.tiltX || 0,
          z: data.tiltZ || 0
        };
      }
    }

    bus.emit('gestureUpdated', this.state.gesture);
  }

  setVoiceListening(isListening) {
    this.state.voice.isListening = isListening;
    bus.emit('voiceListeningChanged', isListening);
  }

  setVoiceTranscript(transcript) {
    this.state.voice.lastTranscript = transcript;
    bus.emit('voiceTranscript', transcript);
  }

  setVoiceSpeaking(isSpeaking) {
    this.state.voice.isSpeaking = isSpeaking;
    bus.emit('voiceSpeakingChanged', isSpeaking);
  }

  setVoiceAcknowledgment(msg) {
    this.state.voice.acknowledgment = msg;
    bus.emit('voiceAcknowledgment', msg);
  }

  updateDiagnostics(data) {
    this.state.diagnostics = { ...this.state.diagnostics, ...data };
    bus.emit('diagnosticsUpdated', this.state.diagnostics);
  }

  getState() {
    return this.state;
  }
}

export const stateManager = new StateManager();
