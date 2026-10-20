import { CONFIG } from '../config.js';

/**
 * Multi-Provider AI Registry
 * Dedicated request formatting, response parsing, and connection testing for each provider.
 */
export class ProviderRegistry {
  /**
   * Google Gemini Adapter
   */
  static async sendGemini(apiKey, model, messages, systemPrompt) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Convert chat history to Gemini contents format
    const contents = [];
    
    // Add history
    for (const msg of messages) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    const payload = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gemini API Error: HTTP ${res.status}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }
    return text;
  }

  /**
   * OpenAI / OpenAI-Compatible (OpenAI, Groq, DeepSeek, Custom) Adapter
   */
  static async sendOpenAICompatible(endpoint, apiKey, model, messages, systemPrompt) {
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `API Error: HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Provider returned an empty response.');
    }
    return text;
  }

  /**
   * Anthropic Claude Adapter
   */
  static async sendClaude(apiKey, model, messages, systemPrompt) {
    const endpoint = 'https://api.anthropic.com/v1/messages';

    const formattedMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model,
        system: systemPrompt,
        messages: formattedMessages,
        max_tokens: 1024
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Claude API Error: HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text;
    if (!text) {
      throw new Error('Claude returned an empty response.');
    }
    return text;
  }

  /**
   * Generic Dispatcher based on active provider
   */
  static async sendMessage(providerKey, config, messages) {
    const { apiKey, model, customEndpoint, systemPrompt } = config;

    if (providerKey === 'gemini') {
      if (!apiKey) throw new Error('Gemini API key is required. Enter your key in AI Settings.');
      return await this.sendGemini(apiKey, model || CONFIG.aiProviders.gemini.defaultModel, messages, systemPrompt);
    }

    if (providerKey === 'openai') {
      if (!apiKey) throw new Error('OpenAI API key is required. Enter your key in AI Settings.');
      const endpoint = CONFIG.aiProviders.openai.endpoint;
      return await this.sendOpenAICompatible(endpoint, apiKey, model || CONFIG.aiProviders.openai.defaultModel, messages, systemPrompt);
    }

    if (providerKey === 'claude') {
      if (!apiKey) throw new Error('Claude API key is required. Enter your key in AI Settings.');
      return await this.sendClaude(apiKey, model || CONFIG.aiProviders.claude.defaultModel, messages, systemPrompt);
    }

    if (providerKey === 'groq') {
      if (!apiKey) throw new Error('Groq API key is required. Enter your key in AI Settings.');
      const endpoint = CONFIG.aiProviders.groq.endpoint;
      return await this.sendOpenAICompatible(endpoint, apiKey, model || CONFIG.aiProviders.groq.defaultModel, messages, systemPrompt);
    }

    if (providerKey === 'deepseek') {
      if (!apiKey) throw new Error('DeepSeek API key is required. Enter your key in AI Settings.');
      const endpoint = CONFIG.aiProviders.deepseek.endpoint;
      return await this.sendOpenAICompatible(endpoint, apiKey, model || CONFIG.aiProviders.deepseek.defaultModel, messages, systemPrompt);
    }

    if (providerKey === 'custom') {
      if (!customEndpoint) throw new Error('Custom endpoint URL is required.');
      return await this.sendOpenAICompatible(customEndpoint, apiKey || 'sk-none', model || 'default', messages, systemPrompt);
    }

    throw new Error(`Unsupported provider: ${providerKey}`);
  }

  /**
   * Validate / Test connection with a dummy prompt
   */
  static async testConnection(providerKey, config) {
    const testMessages = [{ role: 'user', content: 'Respond with the single word: READY.' }];
    const reply = await this.sendMessage(providerKey, config, testMessages);
    return reply.trim();
  }
}
