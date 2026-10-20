# ULTRON — System Architecture & Technical Specifications

## 1. 3D Particle Energy Engine
- **Renderer**: Three.js WebGL with additive blending and depth attenuation.
- **Custom Shader**: Soft circular photon glow with Gaussian radial drop-off.
- **Layered Structure**:
  - 35% Inner dense core
  - 40% Outer volumetric shell
  - 15% Intersecting tilted orbital energy bands
  - 10% Wandering sparks with phase-shifted flickering
- **Morphing Pipeline**: Deterministic 3D point generation for Sphere, Core, Expanded Cloud, Torus, Galaxy Spiral, 3D Heart, and Energy Burst. Preserves particle identity with spring-damped morphing.
- **Quality Presets**: LOW (4k), BALANCED (12k), HIGH (24k), ULTRA (42k).

## 2. Vision & Hand Gesture Pipeline
- **MediaPipe Hand Landmarker**: 21 3D landmarks.
- **Openness Formula**:
  $$\text{Openness} = \text{clamp}\left(\frac{\frac{1}{5}\sum_{i \in \text{tips}} \|\mathbf{p}_i - \mathbf{p}_{\text{wrist}}\| - d_{\text{min}}}{d_{\text{max}} - d_{\text{min}}}, 0, 1\right)$$
  normalized against palm span $\|\mathbf{p}_{\text{middle\_MCP}} - \mathbf{p}_{\text{wrist}}\|$.
- **Gesture States**:
  - Closed Fist: Openness $\le 0.28 \to$ Compresses energy ball into compact bright core ($0.42\times$).
  - Open Palm: Openness $\ge 0.72 \to$ Expands outer particle cloud ($1.85\times$).
  - Neutral / Intermediate: Continuous linear interpolation with zero jitter.
- **Temporal Stability**: Exponential smoothing filter ($\alpha = 0.16$) with dead-zone masking.

## 3. Voice Command Engine
- Local zero-latency regex parser for color shifts (13 colors), shape morphing, size scaling, and pulse activation.
- Native Android `SpeechRecognizer` + Web Speech API fallback.
- Native Android `TextToSpeech` + Web SpeechSynthesis fallback.
