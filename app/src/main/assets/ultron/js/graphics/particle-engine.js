import { CONFIG } from '../config.js';
import { stateManager } from '../core/state-manager.js';
import { bus } from '../core/event-bus.js';
import { particleVertexShader, particleFragmentShader } from './particle-shaders.js';
import { ParticleShapes } from './particle-shapes.js';

/**
 * Three.js WebGL Particle Engine for Ultron
 */
export class ParticleEngine {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this.geometry = null;
    this.material = null;
    
    this.particleCount = CONFIG.qualityPresets[stateManager.state.quality].count;
    this.currentShape = 'sphere';
    this.targetShapePositions = null;
    this.baseSphereData = null;

    // Smooth animation lerping
    this.currentExpansion = 1.0;
    this.currentPos = { x: 0, y: 0, z: 0 };
    this.currentRot = { x: 0, y: 0, z: 0 };
    this.currentColorRGB = new THREE.Vector3(...CONFIG.colors.cyan.rgb);
    this.targetColorRGB = new THREE.Vector3(...CONFIG.colors.cyan.rgb);
    this.morphProgress = 1.0;
    this.morphSpeed = 2.4;

    // Performance diagnostics
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.fps = 60;
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    // 1. Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030712, 0.05);

    // 2. Perspective Camera (Mobile-first aspect ratio)
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 5.0);

    // 3. WebGL Renderer with High-Performance Settings
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: false,
      alpha: true,
      stencil: false,
      depth: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
    this.renderer.setClearColor(0x030712, 1.0);
    this.container.appendChild(this.renderer.domElement);

    // 4. Create Volumetric Particles System
    this.buildParticleSystem(this.particleCount);

    // 5. Setup Event Listeners
    this.setupListeners();

    // 6. Handle Window Resizing
    window.addEventListener('resize', () => this.onWindowResize(), { passive: true });

    // 7. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildParticleSystem(count) {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.geometry.dispose();
      this.material.dispose();
    }

    this.particleCount = count;
    this.baseSphereData = ParticleShapes.generateSphere(count, CONFIG.sphere.baseRadius);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.baseSphereData.positions.slice(), 3));
    this.geometry.setAttribute('aTargetPosition', new THREE.BufferAttribute(this.baseSphereData.positions.slice(), 3));
    this.geometry.setAttribute('aLayer', new THREE.BufferAttribute(this.baseSphereData.layers, 1));
    this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(this.baseSphereData.phases, 1));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.baseSphereData.sizes, 1));

    const morphArr = new Float32Array(count);
    morphArr.fill(1.0);
    this.geometry.setAttribute('aMorphProgress', new THREE.BufferAttribute(morphArr, 1));

    const activeColor = CONFIG.colors[stateManager.state.currentColor] || CONFIG.colors.cyan;
    this.targetColorRGB.set(...activeColor.rgb);
    this.currentColorRGB.copy(this.targetColorRGB);

    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uExpansion: { value: 1.0 },
        uPulseTime: { value: 0.0 },
        uPointSize: { value: CONFIG.qualityPresets[stateManager.state.quality].pointSize },
        uTargetColor: { value: this.currentColorRGB },
        uColorMix: { value: 1.0 },
        uTurbulence: { value: CONFIG.sphere.turbulenceAmplitude }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);
  }

  setupListeners() {
    bus.on('colorChanged', (colorData) => {
      if (colorData.isDynamic) {
        // Rainbow mode handled dynamically in animate
      } else if (colorData.rgb) {
        this.targetColorRGB.set(...colorData.rgb);
      }
    });

    bus.on('shapeChanged', (shapeName) => {
      this.morphToShape(shapeName);
    });

    bus.on('qualityChanged', (qualityKey) => {
      const preset = CONFIG.qualityPresets[qualityKey];
      if (preset && preset.count !== this.particleCount) {
        this.buildParticleSystem(preset.count);
        this.morphToShape(stateManager.state.currentShape);
      }
    });

    bus.on('pulseTriggered', () => {
      this.triggerPulseWave();
    });
  }

  morphToShape(shapeName) {
    this.currentShape = shapeName;
    let targetPositions = null;

    switch (shapeName) {
      case 'core':
        targetPositions = ParticleShapes.generateCompactCore(this.particleCount);
        break;
      case 'expanded':
        targetPositions = ParticleShapes.generateExpanded(this.particleCount);
        break;
      case 'torus':
        targetPositions = ParticleShapes.generateTorus(this.particleCount);
        break;
      case 'galaxy':
        targetPositions = ParticleShapes.generateGalaxy(this.particleCount);
        break;
      case 'heart':
        targetPositions = ParticleShapes.generateHeart(this.particleCount);
        break;
      case 'burst':
        targetPositions = ParticleShapes.generateBurst(this.particleCount);
        break;
      case 'sphere':
      default:
        targetPositions = this.baseSphereData.positions;
        break;
    }

    if (targetPositions && this.geometry) {
      // Copy current interpolated positions into position attribute
      const posAttr = this.geometry.attributes.position;
      const targetAttr = this.geometry.attributes.aTargetPosition;
      const morphAttr = this.geometry.attributes.aMorphProgress;

      const pArr = posAttr.array;
      const tArr = targetAttr.array;
      const progress = this.morphProgress;

      // Bake current in-between position
      for (let i = 0; i < pArr.length; i++) {
        pArr[i] = pArr[i] + (tArr[i] - pArr[i]) * progress;
      }
      posAttr.needsUpdate = true;

      // Set new target
      targetAttr.copyArray(targetPositions);
      targetAttr.needsUpdate = true;

      // Reset morph progress
      this.morphProgress = 0.0;
      morphAttr.array.fill(0.0);
      morphAttr.needsUpdate = true;
    }
  }

  triggerPulseWave() {
    if (this.material) {
      this.material.uniforms.uPulseTime.value = 0.01;
    }
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Rainbow Dynamic Mode
    if (stateManager.state.currentColor === 'rainbow') {
      const r = Math.sin(elapsedTime * 1.5) * 0.5 + 0.5;
      const g = Math.sin(elapsedTime * 1.5 + 2.09) * 0.5 + 0.5;
      const b = Math.sin(elapsedTime * 1.5 + 4.18) * 0.5 + 0.5;
      this.targetColorRGB.set(r, g, b);
    }

    // 2. Smoothly Interpolate Active Color
    this.currentColorRGB.lerp(this.targetColorRGB, delta * 6.0);

    // 3. Smoothly Interpolate Expansion Scale (Fist -> Compact, Palm -> Expanded)
    const targetScale = stateManager.state.expansion;
    this.currentExpansion += (targetScale - this.currentExpansion) * delta * 7.5;

    // 4. Smoothly Interpolate Hand Position
    const targetPos = stateManager.state.targetPos;
    this.currentPos.x += (targetPos.x - this.currentPos.x) * delta * 8.0;
    this.currentPos.y += (targetPos.y - this.currentPos.y) * delta * 8.0;
    this.currentPos.z += (targetPos.z - this.currentPos.z) * delta * 8.0;

    // 5. Smoothly Interpolate Hand Rotation
    const targetRot = stateManager.state.targetRot;
    this.currentRot.x += (targetRot.x - this.currentRot.x) * delta * 6.0;
    this.currentRot.y += (targetRot.y - this.currentRot.y) * delta * 6.0;
    this.currentRot.z += (targetRot.z - this.currentRot.z) * delta * 6.0;

    // 6. Update Particle System Transforms
    if (this.particles) {
      this.particles.position.set(this.currentPos.x, this.currentPos.y, this.currentPos.z);
      
      // Base continuous rotation plus gesture tilt
      this.particles.rotation.y = elapsedTime * CONFIG.sphere.rotationSpeed + this.currentRot.y;
      this.particles.rotation.x = this.currentRot.x * 0.8;
      this.particles.rotation.z = this.currentRot.z * 0.8;
    }

    // 7. Update Shape Morphing Progress
    if (this.morphProgress < 1.0 && this.geometry) {
      this.morphProgress = Math.min(1.0, this.morphProgress + delta * this.morphSpeed);
      const morphAttr = this.geometry.attributes.aMorphProgress;
      morphAttr.array.fill(this.morphProgress);
      morphAttr.needsUpdate = true;
    }

    // 8. Update Shader Uniforms
    if (this.material) {
      const u = this.material.uniforms;
      u.uTime.value = elapsedTime;
      u.uExpansion.value = this.currentExpansion;
      u.uTargetColor.value.copy(this.currentColorRGB);

      // Handle shockwave pulse progress
      if (u.uPulseTime.value > 0.0) {
        u.uPulseTime.value += delta * 1.5;
        if (u.uPulseTime.value > 1.2) {
          u.uPulseTime.value = 0.0;
        }
      }
    }

    // 9. Render Scene
    this.renderer.render(this.scene, this.camera);

    // 10. Frame Rate Diagnostics
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      const frameTime = (now - this.lastFpsUpdate) / this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;

      stateManager.updateDiagnostics({
        fps: this.fps,
        frameTime: parseFloat(frameTime.toFixed(1)),
        particleCount: this.particleCount
      });
    }
  }
}
