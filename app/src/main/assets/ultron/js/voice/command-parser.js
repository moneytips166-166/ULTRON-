import { CONFIG } from '../config.js';

/**
 * CommandParser: High-speed local regex parser for voice commands.
 * Runs instantly on device with zero API latency.
 */
export class CommandParser {
  static parse(transcript) {
    if (!transcript || typeof transcript !== 'string') return null;

    const text = transcript.toLowerCase().trim();

    // 1. Color Change Commands
    // "Ultron, change the colour to red", "make it green", "switch to blue", "use cyan", "restore default color"
    const colorNames = Object.keys(CONFIG.colors);
    for (const color of colorNames) {
      const colorRegex = new RegExp(`(?:change|turn|make|switch|set|use)?.*?(?:colour|color|particles?)?.*?(?:to|into|as)?\\s*\\b(${color})\\b`, 'i');
      if (colorRegex.test(text)) {
        return {
          type: 'SET_COLOR',
          payload: color,
          acknowledgment: `Changing energy core to ${color.toUpperCase()}.`
        };
      }
    }

    if (text.includes('restore default') || text.includes('default color') || text.includes('default colour')) {
      return {
        type: 'SET_COLOR',
        payload: 'cyan',
        acknowledgment: 'Restoring default cyan energy core.'
      };
    }

    // 2. Shape Morphing Commands
    // "Ultron, show galaxy", "switch to heart", "show energy sphere", "return to core", "energy ring", "torus"
    if (text.includes('galaxy') || text.includes('spiral')) {
      return {
        type: 'SET_SHAPE',
        payload: 'galaxy',
        acknowledgment: 'Morphing particles into galaxy spiral.'
      };
    }
    if (text.includes('heart')) {
      return {
        type: 'SET_SHAPE',
        payload: 'heart',
        acknowledgment: 'Morphing energy into heart matrix.'
      };
    }
    if (text.includes('torus') || text.includes('ring') || text.includes('halo')) {
      return {
        type: 'SET_SHAPE',
        payload: 'torus',
        acknowledgment: 'Configuring gyroscopic energy ring.'
      };
    }
    if (text.includes('burst') || text.includes('explosion') || text.includes('shockwave')) {
      return {
        type: 'SET_SHAPE',
        payload: 'burst',
        acknowledgment: 'Energy burst activated.'
      };
    }
    if (text.includes('compact') || text.includes('fist') || text.includes('core')) {
      return {
        type: 'SET_SHAPE',
        payload: 'core',
        acknowledgment: 'Compressing into dense singularity core.'
      };
    }
    if (text.includes('sphere') || text.includes('ball') || text.includes('default shape')) {
      return {
        type: 'SET_SHAPE',
        payload: 'sphere',
        acknowledgment: 'Re-aligning volumetric energy sphere.'
      };
    }

    // 3. Energy Pulse
    if (text.includes('activate energy pulse') || text.includes('pulse') || text.includes('shock wave')) {
      return {
        type: 'TRIGGER_PULSE',
        payload: true,
        acknowledgment: 'Energy pulse discharged.'
      };
    }

    // 4. Scaling / Sizing
    if (text.includes('bigger') || text.includes('expand') || text.includes('increase size') || text.includes('large')) {
      return {
        type: 'ADJUST_SIZE',
        payload: 1.6,
        acknowledgment: 'Expanding particle radius.'
      };
    }
    if (text.includes('smaller') || text.includes('shrink') || text.includes('decrease size') || text.includes('compact')) {
      return {
        type: 'ADJUST_SIZE',
        payload: 0.6,
        acknowledgment: 'Compacting energy radius.'
      };
    }

    // 5. Operating Modes
    if (text.includes('hand control') || text.includes('gesture mode') || text.includes('hand mode')) {
      return {
        type: 'SET_MODE',
        payload: 'hand',
        acknowledgment: 'Hand gesture tracking engaged.'
      };
    }
    if (text.includes('normal mode') || text.includes('standard mode') || text.includes('idle mode')) {
      return {
        type: 'SET_MODE',
        payload: 'normal',
        acknowledgment: 'Normal mode restored.'
      };
    }

    // 6. Camera Controls
    if (text.includes('stop camera') || text.includes('turn off camera') || text.includes('disable camera')) {
      return {
        type: 'STOP_CAMERA',
        payload: true,
        acknowledgment: 'Camera feed terminated.'
      };
    }

    // 7. System UI Controls
    if (text.includes('show settings') || text.includes('open settings') || text.includes('ai settings')) {
      return {
        type: 'OPEN_SETTINGS',
        payload: true,
        acknowledgment: 'Accessing control interface.'
      };
    }
    if (text.includes('stop speaking') || text.includes('quiet') || text.includes('silence')) {
      return {
        type: 'STOP_SPEAKING',
        payload: true,
        acknowledgment: ''
      };
    }
    if (text.includes('stop listening')) {
      return {
        type: 'STOP_LISTENING',
        payload: true,
        acknowledgment: 'Voice standby.'
      };
    }

    // Unmatched command: candidate for AI conversation
    return null;
  }
}
