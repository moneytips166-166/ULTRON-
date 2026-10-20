import { stateManager } from '../core/state-manager.js';
import { bus } from '../core/event-bus.js';
import { ProviderRegistry } from './provider-registry.js';
import { speechOutput } from '../voice/speech-output.js';

/**
 * ChatManager: Handles conversation flow, history, and voice response synthesis.
 */
export class ChatManager {
  constructor() {
    this.messages = [];
    this.isResponding = false;
    this.voiceReplyEnabled = true;

    this.init();
  }

  init() {
    // If AndroidBridge has a pre-configured Gemini API Key, auto-populate if currently empty
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.getGeminiApiKey === 'function') {
        const injectedKey = window.AndroidBridge.getGeminiApiKey();
        if (injectedKey && injectedKey !== 'MY_GEMINI_API_KEY' && !stateManager.state.ai.apiKey) {
          stateManager.state.ai.apiKey = injectedKey;
          stateManager.saveSettings();
          console.log('[ChatManager] Auto-populated Gemini API key from AI Studio AndroidBridge.');
        }
      }
    } catch (e) {
      console.warn('[ChatManager] Key injection check error:', e);
    }

    // Listen for unmatched speech transcripts from user voice commands
    bus.on('unmatchedVoiceTranscript', (text) => {
      this.sendUserMessage(text);
    });
  }

  async sendUserMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || this.isResponding) return;

    // 1. Append user message
    const userMsg = { id: Date.now().toString(), role: 'user', content: trimmed, time: new Date() };
    this.messages.push(userMsg);
    bus.emit('chatMessageAdded', userMsg);

    this.isResponding = true;
    bus.emit('aiRespondingState', true);

    try {
      const provider = stateManager.state.ai.provider;
      const aiConfig = {
        apiKey: stateManager.state.ai.apiKey,
        model: stateManager.state.ai.model,
        customEndpoint: stateManager.state.ai.customEndpoint,
        systemPrompt: stateManager.state.ai.systemPrompt
      };

      // 2. Request AI Response
      const responseText = await ProviderRegistry.sendMessage(provider, aiConfig, this.messages);

      // 3. Append assistant message
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        time: new Date()
      };
      this.messages.push(assistantMsg);
      bus.emit('chatMessageAdded', assistantMsg);

      // 4. Speak response if enabled
      if (this.voiceReplyEnabled) {
        // Strip markdown code blocks for speech
        const speechText = responseText.replace(/```[\s\S]*?```/g, '').replace(/[*#_`]/g, '');
        speechOutput.speak(speechText);
      }
    } catch (err) {
      console.error('[ChatManager] AI Request failed:', err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        isError: true,
        content: `Error: ${err.message || 'Unable to communicate with AI provider.'}`,
        time: new Date()
      };
      this.messages.push(errorMsg);
      bus.emit('chatMessageAdded', errorMsg);
    } finally {
      this.isResponding = false;
      bus.emit('aiRespondingState', false);
    }
  }

  clearHistory() {
    this.messages = [];
    bus.emit('chatHistoryCleared');
  }

  toggleVoiceReply() {
    this.voiceReplyEnabled = !this.voiceReplyEnabled;
    return this.voiceReplyEnabled;
  }
}

export const chatManager = new ChatManager();
