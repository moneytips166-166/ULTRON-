import { CONFIG } from '../config.js';
import { stateManager } from '../core/state-manager.js';
import { bus } from '../core/event-bus.js';

/**
 * HandTracker: MediaPipe Hand Landmarker integration
 * Calculates palm center, continuous hand openness (fist vs open palm),
 * orientation, and performs exponential filtering to prevent tracking jitter.
 */
export class HandTracker {
  constructor(videoElement, previewCanvas) {
    this.video = videoElement;
    this.canvas = previewCanvas;
    this.ctx = previewCanvas ? previewCanvas.getContext('2d') : null;

    this.hands = null;
    this.cameraUtils = null;
    this.isTracking = false;
    this.lastTrackingTime = 0;
    this.frameCount = 0;
    this.visionFps = 0;

    // Smoothed values for temporal stability
    this.smoothedPalm = { x: 0, y: 0, z: 0 };
    this.smoothedOpenness = 0.5;
    this.smoothedTilt = { x: 0, y: 0, z: 0 };
    this.currentGestureType = 'neutral';

    // Grace period before falling back to idle
    this.trackingLossGraceMs = 600;
    this.lastDetectedTime = 0;

    this.init();
  }

  async init() {
    try {
      // Use MediaPipe Hands if window.Hands is loaded
      if (typeof window.Hands !== 'undefined') {
        this.hands = new window.Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        this.hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: CONFIG.gestures.minDetectionConfidence,
          minTrackingConfidence: CONFIG.gestures.minTrackingConfidence
        });

        this.hands.onResults((results) => this.onResults(results));
        console.log('[HandTracker] MediaPipe Hands initialized successfully.');
      } else {
        console.warn('[HandTracker] MediaPipe Hands library not loaded globally.');
      }
    } catch (e) {
      console.warn('[HandTracker] MediaPipe initialization error:', e);
    }
  }

  start() {
    this.isTracking = true;
    this.processLoop = this.processLoop.bind(this);
    requestAnimationFrame(this.processLoop);
  }

  stop() {
    this.isTracking = false;
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    stateManager.updateGestureData({
      hasHand: false,
      confidence: 0
    });
  }

  async processLoop() {
    if (!this.isTracking) return;

    if (this.video && this.video.readyState >= 2 && this.hands) {
      try {
        await this.hands.send({ image: this.video });
      } catch (err) {
        // frame drop or busy
      }
    }

    // Check tracking loss grace period
    const now = performance.now();
    if (now - this.lastDetectedTime > this.trackingLossGraceMs) {
      if (stateManager.state.gesture.hasHand) {
        stateManager.updateGestureData({
          hasHand: false,
          confidence: 0
        });
      }
    }

    // FPS calculation
    this.frameCount++;
    if (now - this.lastTrackingTime >= 1000) {
      this.visionFps = this.frameCount;
      this.frameCount = 0;
      this.lastTrackingTime = now;
      stateManager.updateDiagnostics({ visionFps: this.visionFps });
    }

    if (this.isTracking) {
      requestAnimationFrame(this.processLoop);
    }
  }

  onResults(results) {
    if (!results || !results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      return;
    }

    this.lastDetectedTime = performance.now();
    const landmarks = results.multiHandLandmarks[0];

    // 1. Calculate Palm Center (Average of wrist 0, index MCP 5, middle MCP 9, pinky MCP 17)
    const wrist = landmarks[0];
    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];
    const pinkyMcp = landmarks[17];

    const rawPalmX = (wrist.x + indexMcp.x + middleMcp.x + pinkyMcp.x) / 4.0;
    const rawPalmY = (wrist.y + indexMcp.y + middleMcp.y + pinkyMcp.y) / 4.0;
    const rawPalmZ = (wrist.z + indexMcp.z + middleMcp.z + pinkyMcp.z) / 4.0;

    // Convert normalized 0..1 to centered screen coords -0.5..0.5 (mirrored horizontally for selfie cam)
    const centeredX = -(rawPalmX - 0.5); // mirrored
    const centeredY = (rawPalmY - 0.5);

    // Apply dead zone filtering
    const deadZone = CONFIG.gestures.deadZone;
    const filteredX = Math.abs(centeredX) < deadZone ? 0 : centeredX;
    const filteredY = Math.abs(centeredY) < deadZone ? 0 : centeredY;

    // Exponential smoothing for position
    const alpha = CONFIG.gestures.smoothingFactor;
    this.smoothedPalm.x += (filteredX - this.smoothedPalm.x) * alpha;
    this.smoothedPalm.y += (filteredY - this.smoothedPalm.y) * alpha;
    this.smoothedPalm.z += (rawPalmZ - this.smoothedPalm.z) * alpha;

    // 2. Hand Openness Metric
    // Distance from wrist to middle MCP is our reference palm length
    const palmLength = Math.hypot(
      middleMcp.x - wrist.x,
      middleMcp.y - wrist.y,
      middleMcp.z - wrist.z
    );

    if (palmLength > 0.001) {
      // Measure distances from wrist to all 5 fingertips: 4(thumb), 8(index), 12(middle), 16(ring), 20(pinky)
      const tips = [4, 8, 12, 16, 20];
      let totalTipDist = 0;

      for (const tipIdx of tips) {
        const tip = landmarks[tipIdx];
        const dist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y, tip.z - wrist.z);
        totalTipDist += dist;
      }

      const avgTipDist = totalTipDist / 5.0;
      const normalizedRatio = avgTipDist / palmLength;

      // When fist is closed, normalizedRatio is ~0.8-1.0
      // When palm is fully open, normalizedRatio is ~1.9-2.4
      // Map smoothly into [0.0, 1.0]
      const minRatio = 0.95;
      const maxRatio = 2.05;
      const rawOpenness = Math.min(1.0, Math.max(0.0, (normalizedRatio - minRatio) / (maxRatio - minRatio)));

      // Smooth openness
      this.smoothedOpenness += (rawOpenness - this.smoothedOpenness) * 0.22;

      // 3. Gesture Classification with Hysteresis
      const fistThresh = CONFIG.gestures.fistThreshold;
      const openThresh = CONFIG.gestures.openPalmThreshold;
      const margin = CONFIG.gestures.hysteresisMargin;

      if (this.currentGestureType === 'fist') {
        if (this.smoothedOpenness > fistThresh + margin) {
          this.currentGestureType = this.smoothedOpenness >= openThresh ? 'open_palm' : 'neutral';
        }
      } else if (this.currentGestureType === 'open_palm') {
        if (this.smoothedOpenness < openThresh - margin) {
          this.currentGestureType = this.smoothedOpenness <= fistThresh ? 'fist' : 'neutral';
        }
      } else {
        if (this.smoothedOpenness <= fistThresh) {
          this.currentGestureType = 'fist';
        } else if (this.smoothedOpenness >= openThresh) {
          this.currentGestureType = 'open_palm';
        }
      }

      // 4. Orientation Tilt
      const tiltX = (middleMcp.x - wrist.x) * 2.5;
      const tiltY = (middleMcp.y - wrist.y) * 2.5;

      // 5. Update State Manager
      stateManager.updateGestureData({
        hasHand: true,
        openness: this.smoothedOpenness,
        gestureType: this.currentGestureType,
        confidence: 0.9,
        rawX: this.smoothedPalm.x,
        rawY: this.smoothedPalm.y,
        rawZ: this.smoothedPalm.z,
        tiltX: tiltX,
        tiltY: tiltY
      });
    }

    // 6. Draw Skeleton Preview on PIP Canvas
    this.drawPreview(landmarks);
  }

  drawPreview(landmarks) {
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    // Color based on active state
    const isFist = this.currentGestureType === 'fist';
    const isOpen = this.currentGestureType === 'open_palm';
    const strokeColor = isFist ? '#EF4444' : (isOpen ? '#00F5FF' : '#8B5CF6');

    // Draw hand skeleton lines
    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],
      [0,17]
    ];

    this.ctx.save();
    // Mirror horizontally to match front camera
    this.ctx.translate(w, 0);
    this.ctx.scale(-1, 1);

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = strokeColor;

    for (const [i, j] of connections) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x * w, p1.y * h);
      this.ctx.lineTo(p2.x * w, p2.y * h);
      this.ctx.stroke();
    }

    // Draw landmark points
    this.ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      this.ctx.beginPath();
      this.ctx.arc(pt.x * w, pt.y * h, (i === 4 || i === 8 || i === 12 || i === 16 || i === 20) ? 3.5 : 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }
}
