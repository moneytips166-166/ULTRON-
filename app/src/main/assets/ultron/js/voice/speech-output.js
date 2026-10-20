import { stateManager } from '../core/state-manager.js';
import { bus } from '../core/event-bus.js';

/**
 * SpeechOutput: Synthesizes spoken voice responses using Android Bridge or Web SpeechSynthesis.
 */
export class SpeechOutput {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.selectedVoice = null;
    this.enabled = true;
    this.rate = 1.05;
    this.pitch = 0.95; // Slightly deeper, authoritative cybernetic cadence

    this.init();
  }

  init() {
    if (this.synth) {
      const loadVoices = () => {
        const voices = this.synth.getVoices();
        // Prefer English robotic/clear voices
        this.selectedVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))) || voices[0];
      };

      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
      loadVoices();
    }
  }

  speak(text) {
    if (!text || !this.enabled) return;

    // Interrupt current speech
    this.stop();

    // 1. Try Android Native Bridge
    if (window.AndroidBridge && typeof window.AndroidBridge.speak === 'function') {
      stateManager.setVoiceSpeaking(true);
      window.AndroidBridge.speak(text);
      // Fallback timer to reset speaking state
      setTimeout(() => stateManager.setVoiceSpeaking(false), Math.max(1500, text.length * 75));
      return;
    }

    // 2. Web Speech API Fallback
    if (this.synth) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }
        utterance.rate = this.rate;
        utterance.pitch = this.pitch;

        utterance.onstart = () => {
          stateManager.setVoiceSpeaking(true);
        };
        utterance.onend = () => {
          stateManager.setVoiceSpeaking(false);
        };
        utterance.onerror = () => {
          stateManager.setVoiceSpeaking(false);
        };

        this.synth.speak(utterance);
      } catch (e) {
        console.warn('[SpeechOutput] Speech synthesis failed:', e);
        stateManager.setVoiceSpeaking(false);
      }
    }
  }

  stop() {
    if (window.AndroidBridge && typeof window.AndroidBridge.stopSpeaking === 'function') {
      window.AndroidBridge.stopSpeaking();
    }
    if (this.synth) {
      this.synth.cancel();
    }
    stateManager.setVoiceSpeaking(false);
  }

  toggleEnabled() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stop();
    }
    return this.enabled;
  }
}

export const speechOutput = new SpeechOutput();
