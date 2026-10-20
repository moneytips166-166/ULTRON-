import { bus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';

/**
 * CameraManager: Handles video stream lifecycle, permissions, and device cameras.
 */
export class CameraManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.isActive = false;
    this.facingMode = 'user'; // front camera by default for gestures
  }

  async startCamera() {
    if (this.isActive && this.stream) {
      return true;
    }

    try {
      // Check if native Android bridge can request camera permission
      if (window.AndroidBridge && typeof window.AndroidBridge.hasCameraPermission === 'function') {
        const hasPermission = window.AndroidBridge.hasCameraPermission();
        if (!hasPermission && typeof window.AndroidBridge.requestCameraPermission === 'function') {
          window.AndroidBridge.requestCameraPermission();
        }
      }

      const constraints = {
        audio: false,
        video: {
          facingMode: this.facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 30 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;

      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play().then(resolve).catch(resolve);
        };
      });

      this.isActive = true;
      stateManager.updateDiagnostics({ cameraActive: true });
      bus.emit('cameraStarted', { video: this.video });
      return true;
    } catch (err) {
      console.warn('[CameraManager] Could not start camera:', err);
      this.isActive = false;
      stateManager.updateDiagnostics({ cameraActive: false });
      bus.emit('cameraError', {
        message: 'Camera access denied or unavailable. You can use manual controls or the gesture simulator.',
        error: err
      });
      return false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.isActive = false;
    stateManager.updateDiagnostics({ cameraActive: false, visionFps: 0 });
    bus.emit('cameraStopped');
  }

  toggleCamera() {
    if (this.isActive) {
      this.stopCamera();
    } else {
      this.startCamera();
    }
  }
}
