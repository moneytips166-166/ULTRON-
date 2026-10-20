import { CONFIG } from '../config.js';
import { stateManager } from '../core/state-manager.js';
import { bus } from '../core/event-bus.js';
import { speechRecognition } from '../voice/speech-recognition.js';
import { speechOutput } from '../voice/speech-output.js';
import { chatManager } from '../assistant/chat-manager.js';
import { ProviderRegistry } from '../assistant/provider-registry.js';

/**
 * HudManager: Renders and coordinates all sci-fi cyberpunk HUD overlays,
 * panels, drawers, controls, and diagnostics.
 */
export class HudManager {
  constructor() {
    this.initDOMElements();
    this.setupListeners();
    this.populateColorChips();
    this.populateShapeButtons();
    this.populateProviderDropdown();
    this.updateQualityButtons();
  }

  initDOMElements() {
    // Mode toggles
    this.btnModeNormal = document.getElementById('btn-mode-normal');
    this.btnModeHand = document.getElementById('btn-mode-hand');
    
    // Top bar buttons
    this.btnMic = document.getElementById('btn-mic');
    this.btnChatToggle = document.getElementById('btn-chat-toggle');
    this.btnSettingsToggle = document.getElementById('btn-settings-toggle');
    this.btnDiagToggle = document.getElementById('btn-diag-toggle');
    this.btnPipToggle = document.getElementById('btn-pip-toggle');

    // Panes and drawers
    this.chatDrawer = document.getElementById('chat-drawer');
    this.settingsDrawer = document.getElementById('settings-drawer');
    this.diagPanel = document.getElementById('diag-panel');
    this.cameraPip = document.getElementById('camera-pip');

    // Sub-bar toast
    this.transcriptPill = document.getElementById('transcript-pill');
    this.transcriptText = document.getElementById('transcript-text');

    // Hand telemetry indicators
    this.handTelemetryBar = document.getElementById('hand-telemetry');
    this.opennessProgress = document.getElementById('openness-progress');
    this.gestureBadge = document.getElementById('gesture-badge');
    this.simSlider = document.getElementById('sim-openness-slider');

    // AI Chat elements
    this.chatMessagesContainer = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.btnChatSend = document.getElementById('btn-chat-send');
    this.btnChatClear = document.getElementById('btn-chat-clear');
    this.btnChatVoiceToggle = document.getElementById('btn-chat-voice-toggle');
    this.chatLoading = document.getElementById('chat-loading');

    // Settings elements
    this.providerSelect = document.getElementById('provider-select');
    this.modelInput = document.getElementById('model-input');
    this.apiKeyInput = document.getElementById('api-key-input');
    this.customEndpointInput = document.getElementById('custom-endpoint-input');
    this.btnTestConnection = document.getElementById('btn-test-connection');
    this.testStatus = document.getElementById('test-status');

    // Diagnostics telemetry spans
    this.diagFps = document.getElementById('diag-fps');
    this.diagMs = document.getElementById('diag-ms');
    this.diagParticles = document.getElementById('diag-particles');
    this.diagVisionFps = document.getElementById('diag-vision-fps');
    this.diagGesture = document.getElementById('diag-gesture');
    this.diagCoords = document.getElementById('diag-coords');
  }

  setupListeners() {
    // Mode Switching
    this.btnModeNormal?.addEventListener('click', () => {
      stateManager.setMode('normal');
    });

    this.btnModeHand?.addEventListener('click', () => {
      stateManager.setMode('hand');
      bus.emit('requestStartCamera');
    });

    // Voice Mic Toggle
    this.btnMic?.addEventListener('click', () => {
      speechRecognition.toggleListening();
    });

    // Drawer Toggles
    this.btnChatToggle?.addEventListener('click', () => {
      this.toggleDrawer(this.chatDrawer);
      if (this.settingsDrawer.classList.contains('active')) {
        this.settingsDrawer.classList.remove('active');
      }
    });

    this.btnSettingsToggle?.addEventListener('click', () => {
      this.toggleDrawer(this.settingsDrawer);
      if (this.chatDrawer.classList.contains('active')) {
        this.chatDrawer.classList.remove('active');
      }
    });

    this.btnDiagToggle?.addEventListener('click', () => {
      this.diagPanel.classList.toggle('active');
    });

    this.btnPipToggle?.addEventListener('click', () => {
      this.cameraPip.classList.toggle('hidden');
    });

    // Chat send button
    this.btnChatSend?.addEventListener('click', () => this.handleSendMessage());
    this.chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSendMessage();
    });

    this.btnChatClear?.addEventListener('click', () => {
      chatManager.clearHistory();
    });

    this.btnChatVoiceToggle?.addEventListener('click', () => {
      const enabled = chatManager.toggleVoiceReply();
      this.btnChatVoiceToggle.classList.toggle('active', enabled);
    });

    // Settings Provider Change
    this.providerSelect?.addEventListener('change', (e) => {
      const selected = e.target.value;
      stateManager.state.ai.provider = selected;
      const providerMeta = CONFIG.aiProviders[selected];
      if (providerMeta) {
        this.modelInput.value = providerMeta.defaultModel;
        stateManager.state.ai.model = providerMeta.defaultModel;
      }
      this.customEndpointInput.parentElement.style.display = selected === 'custom' ? 'block' : 'none';
      stateManager.saveSettings();
    });

    this.modelInput?.addEventListener('input', (e) => {
      stateManager.state.ai.model = e.target.value.trim();
      stateManager.saveSettings();
    });

    this.apiKeyInput?.addEventListener('input', (e) => {
      stateManager.state.ai.apiKey = e.target.value.trim();
      stateManager.saveSettings();
    });

    this.customEndpointInput?.addEventListener('input', (e) => {
      stateManager.state.ai.customEndpoint = e.target.value.trim();
      stateManager.saveSettings();
    });

    // Test Connection Button
    this.btnTestConnection?.addEventListener('click', async () => {
      this.testStatus.textContent = 'Testing connection...';
      this.testStatus.className = 'test-status testing';
      try {
        const config = {
          apiKey: stateManager.state.ai.apiKey,
          model: stateManager.state.ai.model,
          customEndpoint: stateManager.state.ai.customEndpoint,
          systemPrompt: stateManager.state.ai.systemPrompt
        };
        const reply = await ProviderRegistry.testConnection(stateManager.state.ai.provider, config);
        this.testStatus.textContent = `Success: "${reply}"`;
        this.testStatus.className = 'test-status success';
      } catch (err) {
        this.testStatus.textContent = `Error: ${err.message}`;
        this.testStatus.className = 'test-status error';
      }
    });

    // Virtual Gesture Simulator Slider
    this.simSlider?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      stateManager.updateGestureData({
        hasHand: true,
        openness: val,
        gestureType: val <= 0.28 ? 'fist' : (val >= 0.72 ? 'open_palm' : 'neutral'),
        confidence: 1.0,
        rawX: 0,
        rawY: 0,
        rawZ: 0
      });
    });

    // Event bus updates
    bus.on('modeChanged', (mode) => {
      this.btnModeNormal.classList.toggle('active', mode === 'normal');
      this.btnModeHand.classList.toggle('active', mode === 'hand');
      this.handTelemetryBar.style.display = mode === 'hand' ? 'flex' : 'none';
    });

    bus.on('colorChanged', (color) => {
      this.updateActiveColorChip(color.name);
      this.showToast(`Energy shifted to ${color.name.toUpperCase()}`);
    });

    bus.on('shapeChanged', (shape) => {
      this.updateActiveShapeButton(shape);
      this.showToast(`Geometry morphed to ${shape.toUpperCase()}`);
    });

    bus.on('gestureUpdated', (g) => {
      if (this.opennessProgress) {
        const pct = Math.round(g.openness * 100);
        this.opennessProgress.style.width = `${pct}%`;
      }
      if (this.gestureBadge) {
        const label = g.gestureType === 'fist' ? 'CLOSED FIST' : (g.gestureType === 'open_palm' ? 'OPEN PALM' : 'NEUTRAL');
        this.gestureBadge.textContent = label;
        this.gestureBadge.className = `gesture-badge ${g.gestureType}`;
      }
      if (this.diagGesture) {
        this.diagGesture.textContent = `${g.gestureType} (${Math.round(g.openness * 100)}%)`;
      }
      if (this.diagCoords) {
        this.diagCoords.textContent = `X:${g.rawX.toFixed(2)} Y:${g.rawY.toFixed(2)} Z:${g.rawZ.toFixed(2)}`;
      }
    });

    bus.on('voiceListeningChanged', (isListening) => {
      this.btnMic.classList.toggle('listening', isListening);
    });

    bus.on('voiceTranscript', (text) => {
      this.showToast(`"${text}"`);
    });

    bus.on('voiceAcknowledgment', (msg) => {
      this.showToast(msg);
    });

    bus.on('diagnosticsUpdated', (d) => {
      if (this.diagFps) this.diagFps.textContent = d.fps;
      if (this.diagMs) this.diagMs.textContent = `${d.frameTime}ms`;
      if (this.diagParticles) this.diagParticles.textContent = d.particleCount.toLocaleString();
      if (this.diagVisionFps) this.diagVisionFps.textContent = `${d.visionFps} fps`;
    });

    bus.on('chatMessageAdded', (msg) => {
      this.appendChatMessage(msg);
    });

    bus.on('chatHistoryCleared', () => {
      if (this.chatMessagesContainer) {
        this.chatMessagesContainer.innerHTML = '';
      }
    });

    bus.on('aiRespondingState', (isResponding) => {
      if (this.chatLoading) {
        this.chatLoading.style.display = isResponding ? 'flex' : 'none';
      }
    });
  }

  toggleDrawer(drawer) {
    drawer.classList.toggle('active');
  }

  showToast(text) {
    if (!this.transcriptPill || !this.transcriptText) return;
    this.transcriptText.textContent = text;
    this.transcriptPill.classList.add('visible');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.transcriptPill.classList.remove('visible');
    }, 3200);
  }

  handleSendMessage() {
    const text = this.chatInput.value.trim();
    if (text) {
      this.chatInput.value = '';
      chatManager.sendUserMessage(text);
    }
  }

  appendChatMessage(msg) {
    if (!this.chatMessagesContainer) return;
    const div = document.createElement('div');
    div.className = `chat-msg ${msg.role} ${msg.isError ? 'error' : ''}`;
    
    const sender = document.createElement('span');
    sender.className = 'msg-sender';
    sender.textContent = msg.role === 'user' ? 'YOU' : 'ULTRON';

    const body = document.createElement('div');
    body.className = 'msg-body';
    body.textContent = msg.content;

    div.appendChild(sender);
    div.appendChild(body);
    this.chatMessagesContainer.appendChild(div);
    this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
  }

  populateColorChips() {
    const container = document.getElementById('color-chips');
    if (!container) return;

    Object.entries(CONFIG.colors).forEach(([key, color]) => {
      const chip = document.createElement('button');
      chip.className = `color-chip ${key === stateManager.state.currentColor ? 'active' : ''}`;
      chip.dataset.color = key;
      chip.title = color.name;
      chip.style.backgroundColor = color.hex;
      if (color.isDynamic) {
        chip.style.background = 'linear-gradient(45deg, #00F5FF, #8B5CF6, #EC4899, #EAB308)';
      }
      chip.addEventListener('click', () => {
        stateManager.setColor(key);
      });
      container.appendChild(chip);
    });
  }

  updateActiveColorChip(activeColor) {
    const chips = document.querySelectorAll('.color-chip');
    chips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.color === activeColor);
    });
  }

  populateShapeButtons() {
    const container = document.getElementById('shape-buttons');
    if (!container) return;

    const shapes = [
      { id: 'sphere', label: 'Sphere' },
      { id: 'core', label: 'Core' },
      { id: 'galaxy', label: 'Galaxy' },
      { id: 'torus', label: 'Torus' },
      { id: 'heart', label: 'Heart' },
      { id: 'burst', label: 'Burst' }
    ];

    shapes.forEach(s => {
      const btn = document.createElement('button');
      btn.className = `shape-btn ${s.id === stateManager.state.currentShape ? 'active' : ''}`;
      btn.dataset.shape = s.id;
      btn.textContent = s.label;
      btn.addEventListener('click', () => {
        stateManager.setShape(s.id);
      });
      container.appendChild(btn);
    });
  }

  updateActiveShapeButton(activeShape) {
    const btns = document.querySelectorAll('.shape-btn');
    btns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.shape === activeShape);
    });
  }

  populateProviderDropdown() {
    if (!this.providerSelect) return;
    this.providerSelect.innerHTML = '';
    Object.entries(CONFIG.aiProviders).forEach(([key, p]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = p.name;
      opt.selected = key === stateManager.state.ai.provider;
      this.providerSelect.appendChild(opt);
    });

    if (this.modelInput) this.modelInput.value = stateManager.state.ai.model;
    if (this.apiKeyInput) this.apiKeyInput.value = stateManager.state.ai.apiKey;
    if (this.customEndpointInput) this.customEndpointInput.value = stateManager.state.ai.customEndpoint;
  }

  updateQualityButtons() {
    const container = document.getElementById('quality-presets');
    if (!container) return;
    container.innerHTML = '';

    Object.entries(CONFIG.qualityPresets).forEach(([key, q]) => {
      const btn = document.createElement('button');
      btn.className = `quality-btn ${key === stateManager.state.quality ? 'active' : ''}`;
      btn.textContent = q.label;
      btn.addEventListener('click', () => {
        stateManager.setQuality(key);
        document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      container.appendChild(btn);
    });
  }
}
