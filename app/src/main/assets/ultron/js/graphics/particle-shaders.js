/**
 * Custom GLSL Shaders for Ultron Volumetric Energy Core
 * Provides soft glow point rendering, depth attenuation, turbulence, and shockwave pulses.
 */

export const particleVertexShader = `
  uniform float uTime;
  uniform float uExpansion;
  uniform float uPulseTime;
  uniform float uPointSize;
  uniform vec3 uTargetColor;
  uniform float uColorMix;
  uniform float uTurbulence;

  attribute float aSize;
  attribute vec3 aTargetPosition;
  attribute float aMorphProgress;
  attribute float aPhase;
  attribute float aLayer; // 0: inner core, 1: mid shell, 2: outer ring, 3: spark

  varying vec3 vColor;
  varying float vAlpha;
  varying float vLayer;

  // Simple pseudo-random noise for orbital turbulence
  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    vLayer = aLayer;
    
    // Smooth morph between current and target position
    vec3 morphedPos = mix(position, aTargetPosition, aMorphProgress);

    // Apply continuous orbital rotation and turbulence
    float speed = (aLayer == 0.0) ? 0.8 : (aLayer == 2.0 ? 1.6 : 1.1);
    float angle = uTime * speed * 0.4 + aPhase;
    
    // Micro turbulence displacement
    float noiseOffset = sin(uTime * 2.0 + aPhase * 6.28) * uTurbulence * (aLayer * 0.4 + 0.2);
    vec3 displacedPos = morphedPos;
    displacedPos.x += cos(angle) * noiseOffset;
    displacedPos.y += sin(angle) * noiseOffset;
    displacedPos.z += sin(angle * 1.5) * noiseOffset;

    // Apply expansion scale (from hand openness or shape preset)
    vec3 scaledPos = displacedPos * uExpansion;

    // Shockwave pulse displacement
    if (uPulseTime > 0.0 && uPulseTime < 1.2) {
      float pulseWave = sin(uPulseTime * 3.1415);
      float dist = length(scaledPos);
      scaledPos += normalize(scaledPos + vec3(0.001)) * pulseWave * 0.7 * (1.0 - smoothstep(0.0, 3.0, dist));
    }

    vec4 mvPosition = modelViewMatrix * vec4(scaledPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Perspective depth attenuation for point size
    float depthFactor = 280.0 / -mvPosition.z;
    float baseSize = aSize * uPointSize * depthFactor;
    
    // Spark and core size variations
    if (aLayer == 0.0) {
      baseSize *= 1.35; // Core particles are denser and larger
    } else if (aLayer == 3.0) {
      baseSize *= (0.8 + 0.6 * sin(uTime * 5.0 + aPhase * 10.0)); // Flickering sparks
    }
    
    gl_PointSize = clamp(baseSize, 1.5, 64.0);

    // Dynamic color calculation with layer variation
    vec3 coreColor = mix(uTargetColor, vec3(1.0, 1.0, 1.0), 0.35); // Whiter in center
    vec3 outerColor = uTargetColor;
    
    if (aLayer == 0.0) {
      vColor = coreColor;
      vAlpha = 0.95;
    } else if (aLayer == 1.0) {
      vColor = outerColor;
      vAlpha = 0.75;
    } else if (aLayer == 2.0) {
      // Orbiting energy rings have slight harmonic tint
      vColor = mix(outerColor, vec3(0.6, 0.4, 1.0), 0.3);
      vAlpha = 0.85;
    } else {
      vColor = vec3(1.0, 1.0, 1.0); // Brilliant sparks
      vAlpha = 0.90;
    }
  }
`;

export const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vLayer;

  void main() {
    // Generate soft circular glowing particle with falloff
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    if (dist > 0.5) {
      discard;
    }

    // Gaussian-like smooth radial glow
    float intensity = exp(-dist * dist * 10.0);
    float centerCore = exp(-dist * dist * 35.0);

    // Composite glow + intense central photon core
    vec3 finalColor = vColor * intensity + vec3(1.0) * centerCore * 0.6;
    float finalAlpha = intensity * vAlpha;

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;
