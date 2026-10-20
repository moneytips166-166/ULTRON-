import { stateManager } from '../core/state-manager.js';
import { bus } from '../core/event-bus.js';
import { CommandParser } from './command-parser.js';
import { speechOutput } from './speech-output.js';

/**
 * SpeechRecognitionManager: Listens for user voice commands and handles parsing.
 */
export class SpeechRecognitionManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSupported = false;

    this.init();
  }

  init() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = false; // Push-to-talk session for reliability
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          stateManager.setVoiceListening(true);
        };

        this.recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          stateManager.setVoiceTranscript(transcript);

          // If final result, process
          if (event.results[0].isFinal) {
            this.handleFinalTranscript(transcript);
          }
        };

        this.recognition.onerror = (event) => {
          console.warn('[SpeechRec] Error:', event.error);
          this.isListening = false;
          stateManager.setVoiceListening(false);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          stateManager.setVoiceListening(false);
        };

        this.isSupported = true;
      } catch (e) {
        console.warn('[SpeechRec] Init failed:', e);
      }
    }

    // Expose global callback for native Android SpeechRecognizer bridge
    window.ultronOnNativeSpeechResult = (text, isFinal) => {
      stateManager.setVoiceTranscript(text);
      if (isFinal) {
        this.isListening = false;
        stateManager.setVoiceListening(false);
        this.handleFinalTranscript(text);
      }
    };
  }

  startListening() {
    // 1. Try Android Native Bridge
    if (window.AndroidBridge && typeof window.AndroidBridge.startSpeech === 'function') {
      this.isListening = true;
      stateManager.setVoiceListening(true);
      window.AndroidBridge.startSpeech();
      return true;
    }

    // 2. Web Speech API
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        return true;
      } catch (err) {
        console.warn('[SpeechRec] Start error:', err);
        return false;
      }
    }
    return false;
  }

  stopListening() {
    if (window.AndroidBridge && typeof window.AndroidBridge.stopSpeech === 'function') {
      window.AndroidBridge.stopSpeech();
    }
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    this.isListening = false;
    stateManager.setVoiceListening(false);
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  handleFinalTranscript(transcript) {
    if (!transcript) return;

    // Check for local command first
    const cmd = CommandParser.parse(transcript);

    if (cmd) {
      // Execute local command immediately
      switch (cmd.type) {
        case 'SET_COLOR':
          stateManager.setColor(cmd.payload);
          break;
        case 'SET_SHAPE':
          stateManager.setShape(cmd.payload);
          break;
        case 'TRIGGER_PULSE':
          stateManager.triggerPulse();
          break;
        case 'ADJUST_SIZE':
          stateManager.state.expansion = cmd.payload;
          break;
        case 'SET_MODE':
          stateManager.setMode(cmd.payload);
          break;
        case 'STOP_CAMERA':
          bus.emit('requestStopCamera');
          break;
        case 'OPEN_SETTINGS':
          bus.emit('requestOpenSettings');
          break;
        case 'STOP_SPEAKING':
          speechOutput.stop();
          break;
        case 'STOP_LISTENING':
          this.stopListening();
          break;
      }

      if (cmd.acknowledgment) {
        stateManager.setVoiceAcknowledgment(cmd.acknowledgment);
        speechOutput.speak(cmd.acknowledgment);
      }
    } else {
      // Not a local command -> forward to AI Assistant
      bus.emit('unmatchedVoiceTranscript', transcript);
    }
  }
}

export const speechRecognition = new SpeechRecognitionManager();
