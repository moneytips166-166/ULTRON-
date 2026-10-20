/**
 * Particle Shape Generators for Ultron
 * Generates deterministic 3D coordinate distributions for smooth morphing.
 */

export class ParticleShapes {
  /**
   * Primary Signature: Real Volumetric 3D Energy Sphere
   * 35% inner dense core, 40% outer shells, 15% orbiting energy bands, 10% sparks
   */
  static generateSphere(count, baseRadius = 1.6) {
    const positions = new Float32Array(count * 3);
    const layers = new Float32Array(count);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const ratio = i / count;
      phases[i] = Math.random() * Math.PI * 2;

      if (ratio < 0.35) {
        // Inner Dense Core: clustered tightly in center
        layers[i] = 0.0;
        sizes[i] = 1.0 + Math.random() * 0.5;
        const u = Math.random();
        const r = Math.cbrt(u) * baseRadius * 0.45;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[idx] = r * Math.sin(phi) * Math.cos(theta);
        positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[idx + 2] = r * Math.cos(phi);
      } else if (ratio < 0.75) {
        // Outer Volumetric Shells
        layers[i] = 1.0;
        sizes[i] = 0.8 + Math.random() * 0.4;
        const r = (0.45 + Math.random() * 0.55) * baseRadius;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[idx] = r * Math.sin(phi) * Math.cos(theta);
        positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[idx + 2] = r * Math.cos(phi);
      } else if (ratio < 0.90) {
        // Orbiting Energy Bands (Two intersecting tilted rings)
        layers[i] = 2.0;
        sizes[i] = 0.9 + Math.random() * 0.5;
        const ringTheta = Math.random() * Math.PI * 2;
        const ringRadius = baseRadius * (1.1 + (Math.random() - 0.5) * 0.15);
        const ringChoice = i % 2;

        let x = ringRadius * Math.cos(ringTheta);
        let y = (Math.random() - 0.5) * 0.12;
        let z = ringRadius * Math.sin(ringTheta);

        // Tilt ring
        const tiltAngle = ringChoice === 0 ? 0.65 : -0.75;
        const tiltedY = y * Math.cos(tiltAngle) - z * Math.sin(tiltAngle);
        const tiltedZ = y * Math.sin(tiltAngle) + z * Math.cos(tiltAngle);

        positions[idx] = x;
        positions[idx + 1] = tiltedY;
        positions[idx + 2] = tiltedZ;
      } else {
        // Wandering sparks orbiting wider
        layers[i] = 3.0;
        sizes[i] = 1.2 + Math.random() * 0.8;
        const r = (1.1 + Math.random() * 0.6) * baseRadius;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[idx] = r * Math.sin(phi) * Math.cos(theta);
        positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[idx + 2] = r * Math.cos(phi);
      }
    }

    return { positions, layers, phases, sizes };
  }

  /**
   * Compact Energy Core (Closed Fist shape)
   */
  static generateCompactCore(count) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const u = Math.random();
      const r = Math.pow(u, 0.5) * 0.65; // Heavily concentrated in center
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[idx] = r * Math.sin(phi) * Math.cos(theta);
      positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[idx + 2] = r * Math.cos(phi);
    }
    return positions;
  }

  /**
   * Expanded Cosmic Aura (Open Palm shape)
   */
  static generateExpanded(count) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const r = (0.8 + Math.random() * 2.2);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Flaring outwards
      positions[idx] = r * Math.sin(phi) * Math.cos(theta);
      positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[idx + 2] = r * Math.cos(phi);
    }
    return positions;
  }

  /**
   * Torus / Energy Ring
   */
  static generateTorus(count, majorRadius = 1.8, minorRadius = 0.55) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const r = minorRadius * (0.4 + 0.6 * Math.random());

      positions[idx] = (majorRadius + r * Math.cos(v)) * Math.cos(u);
      positions[idx + 1] = r * Math.sin(v) * 1.2;
      positions[idx + 2] = (majorRadius + r * Math.cos(v)) * Math.sin(u);
    }
    return positions;
  }

  /**
   * Galaxy Spiral: 4 logarithmic spiral arms with galactic core
   */
  static generateGalaxy(count) {
    const positions = new Float32Array(count * 3);
    const numArms = 4;
    const armSeparation = (2 * Math.PI) / numArms;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      if (i < count * 0.25) {
        // Galactic Bulge center
        const r = Math.pow(Math.random(), 2) * 0.7;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[idx] = r * Math.sin(phi) * Math.cos(theta);
        positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5; // Flattened disk
        positions[idx + 2] = r * Math.cos(phi);
      } else {
        // Spiral Arms
        const armIndex = i % numArms;
        const distance = 0.4 + Math.random() * 2.3;
        const angle = distance * 2.2 + armIndex * armSeparation + (Math.random() - 0.5) * 0.45;
        const verticalSpread = (Math.random() - 0.5) * (0.28 / (distance * 0.8 + 0.5));

        positions[idx] = Math.cos(angle) * distance;
        positions[idx + 1] = verticalSpread;
        positions[idx + 2] = Math.sin(angle) * distance;
      }
    }
    return positions;
  }

  /**
   * 3D Parametric Glowing Heart Shape
   */
  static generateHeart(count) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const t = Math.random() * Math.PI * 2;
      // Parametric cardioid curve scaled to 3D
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const zSpread = (Math.random() - 0.5) * 8.0 * (1.0 - Math.abs(y) / 20);

      // Add volumetric noise
      const scale = 0.12 * (0.8 + Math.random() * 0.25);
      positions[idx] = x * scale;
      positions[idx + 1] = y * scale * 0.95;
      positions[idx + 2] = zSpread * scale;
    }
    return positions;
  }

  /**
   * Energy Burst: High velocity radial explosion
   */
  static generateBurst(count) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 1.5 + Math.random() * 2.2;

      positions[idx] = speed * Math.sin(phi) * Math.cos(theta);
      positions[idx + 1] = speed * Math.sin(phi) * Math.sin(theta);
      positions[idx + 2] = speed * Math.cos(phi);
    }
    return positions;
  }
}
