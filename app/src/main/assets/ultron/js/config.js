/**
 * ULTRON Core Configuration
 * Color palettes, particle density presets, AI models, and default parameters.
 */
export const CONFIG = {
  appName: 'ULTRON',
  version: '2.5.0',
  defaultMode: 'normal', // 'normal' | 'hand'

  // Color Registry with RGB/Hex and aura highlights
  colors: {
    cyan: {
      name: 'Cyan Core',
      hex: '#00F5FF',
      rgb: [0.0, 0.96, 1.0],
      secondary: '#0077B6',
      accent: '#90E0EF',
      glow: 'rgba(0, 245, 255, 0.4)'
    },
    blue: {
      name: 'Cobalt Energy',
      hex: '#3B82F6',
      rgb: [0.23, 0.51, 0.96],
      secondary: '#1D4ED8',
      accent: '#93C5FD',
      glow: 'rgba(59, 130, 246, 0.4)'
    },
    violet: {
      name: 'Quantum Violet',
      hex: '#8B5CF6',
      rgb: [0.54, 0.36, 0.96],
      secondary: '#6D28D9',
      accent: '#C4B5FD',
      glow: 'rgba(139, 92, 246, 0.4)'
    },
    purple: {
      name: 'Deep Purple',
      hex: '#A855F7',
      rgb: [0.66, 0.33, 0.97],
      secondary: '#7E22CE',
      accent: '#E9D5FF',
      glow: 'rgba(168, 85, 247, 0.4)'
    },
    magenta: {
      name: 'Plasma Magenta',
      hex: '#EC4899',
      rgb: [0.92, 0.28, 0.60],
      secondary: '#BE185D',
      accent: '#FBCFE8',
      glow: 'rgba(236, 72, 153, 0.4)'
    },
    red: {
      name: 'Hyper Red',
      hex: '#EF4444',
      rgb: [0.94, 0.27, 0.27],
      secondary: '#B91C1C',
      accent: '#FCA5A5',
      glow: 'rgba(239, 68, 68, 0.4)'
    },
    green: {
      name: 'Emerald Matrix',
      hex: '#10B981',
      rgb: [0.06, 0.72, 0.51],
      secondary: '#047857',
      accent: '#6EE7B7',
      glow: 'rgba(16, 185, 129, 0.4)'
    },
    yellow: {
      name: 'Solar Flare',
      hex: '#EAB308',
      rgb: [0.92, 0.70, 0.03],
      secondary: '#A16207',
      accent: '#FEF08A',
      glow: 'rgba(234, 179, 8, 0.4)'
    },
    orange: {
      name: 'Ion Orange',
      hex: '#F97316',
      rgb: [0.97, 0.45, 0.09],
      secondary: '#C2410C',
      accent: '#FDBA74',
      glow: 'rgba(249, 115, 22, 0.4)'
    },
    gold: {
      name: 'Imperial Gold',
      hex: '#F59E0B',
      rgb: [0.96, 0.62, 0.04],
      secondary: '#B45309',
      accent: '#FDE68A',
      glow: 'rgba(245, 158, 11, 0.4)'
    },
    pink: {
      name: 'Neon Pink',
      hex: '#F43F5E',
      rgb: [0.96, 0.25, 0.37],
      secondary: '#BE123C',
      accent: '#FECDD3',
      glow: 'rgba(244, 63, 94, 0.4)'
    },
    white: {
      name: 'Pure Singularity',
      hex: '#F8FAFC',
      rgb: [0.97, 0.98, 0.99],
      secondary: '#64748B',
      accent: '#FFFFFF',
      glow: 'rgba(248, 250, 252, 0.4)'
    },
    rainbow: {
      name: 'Rainbow Phase',
      hex: '#00F5FF',
      rgb: [0.0, 0.96, 1.0],
      secondary: '#8B5CF6',
      accent: '#EC4899',
      isDynamic: true,
      glow: 'rgba(0, 245, 255, 0.4)'
    }
  },

  // Particle Density Presets
  qualityPresets: {
    LOW: { count: 4000, label: 'LOW (4k)', maxFps: 60, pointSize: 22 },
    BALANCED: { count: 12000, label: 'BALANCED (12k)', maxFps: 60, pointSize: 18 },
    HIGH: { count: 24000, label: 'HIGH (24k)', maxFps: 60, pointSize: 15 },
    ULTRA: { count: 42000, label: 'ULTRA (42k)', maxFps: 60, pointSize: 12 }
  },

  // Gesture Recognition Parameters
  gestures: {
    fistThreshold: 0.28,      // Below this openness -> FIST
    openPalmThreshold: 0.72,  // Above this openness -> OPEN PALM
    hysteresisMargin: 0.06,
    smoothingFactor: 0.16,    // Exponential smoothing for landmark movement
    positionSensitivity: 1.8,
    deadZone: 0.035,          // Normalized coordinate dead zone
    minDetectionConfidence: 0.65,
    minTrackingConfidence: 0.60
  },

  // Sphere Physics & Dimensions
  sphere: {
    baseRadius: 1.6,
    fistRadiusScale: 0.42,    // Compact core size multiplier
    openPalmRadiusScale: 1.85,// Expanded energy ball multiplier
    burstScale: 2.5,
    rotationSpeed: 0.35,
    turbulenceAmplitude: 0.14
  },

  // Multi-Provider AI Defaults
  aiProviders: {
    gemini: {
      name: 'Google Gemini',
      defaultModel: 'gemini-2.5-flash',
      availableModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
      authHeaderType: 'queryParam' // key passed in query ?key=
    },
    openai: {
      name: 'OpenAI',
      defaultModel: 'gpt-4o-mini',
      availableModels: ['gpt-4o-mini', 'gpt-4o', 'o3-mini'],
      endpoint: 'https://api.openai.com/v1/chat/completions',
      authHeaderType: 'bearer'
    },
    claude: {
      name: 'Anthropic Claude',
      defaultModel: 'claude-3-5-sonnet-20241022',
      availableModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
      endpoint: 'https://api.anthropic.com/v1/messages',
      authHeaderType: 'x-api-key'
    },
    groq: {
      name: 'Groq Cloud',
      defaultModel: 'llama-3.3-70b-versatile',
      availableModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      authHeaderType: 'bearer'
    },
    deepseek: {
      name: 'DeepSeek',
      defaultModel: 'deepseek-chat',
      availableModels: ['deepseek-chat', 'deepseek-reasoner'],
      endpoint: 'https://api.deepseek.com/chat/completions',
      authHeaderType: 'bearer'
    },
    custom: {
      name: 'Custom OpenAI Endpoint',
      defaultModel: 'default',
      availableModels: ['default'],
      endpoint: '',
      authHeaderType: 'bearer'
    }
  }
};
