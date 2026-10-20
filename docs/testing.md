# ULTRON — Acceptance & Testing Guide

This checklist verifies all 21 acceptance criteria outlined in the master specification:

| # | Acceptance Test | Procedure | Expected Result |
|---|---|---|---|
| 1 | 3D Particle Sphere | Launch app | Volumetric 3D energy ball renders with bright core and depth. |
| 2 | Layered Motion & Glow | Observe idle state | Orbiting energy rings, wandering sparks, and soft photon glow visible. |
| 3 | Open-Palm Detection | Show open hand or slide simulator to 1.0 | Sphere expands smoothly into large cosmic aura with outward particle flow. |
| 4 | Fist Detection | Close hand into fist or slide simulator to 0.0 | Sphere contracts into ultra-dense compact glowing singularity core. |
| 5 | Partial Hand Opening | Vary hand openness (e.g. 50%) | Intermediate sizes interpolate continuously without jumping. |
| 6 | Hand Movement (X/Y) | Move hand left/right/up/down | Sphere tracks hand position in 3D viewport smoothly. |
| 7 | Anti-Jitter Filtering | Hold hand steady | Exponential smoothing prevents tracking twitch/jitter. |
| 8 | Tracking Loss Recovery | Move hand out of camera view | Sphere smoothly eases back to idle without snapping. |
| 9 | Voice: Red | Say "Ultron, change the colour to red" | Spoken acknowledgment and smooth shift to hyper red. |
| 10 | Voice: Blue/Green/Gold | Say "Ultron, make it gold" | Smooth color transition preserving particle motion. |
| 11 | Color Preservation | Change color then switch shape | Selected color persists across shape morphs. |
| 12 | Voice: Galaxy / Heart | Say "Ultron, switch to galaxy" | Particles smoothly morph into 4-arm spiral galaxy. |
| 13 | Speech Interruption | Tap Stop Speaking or give new command | Active voice synthesis stops cleanly. |
| 14 | Text Chat | Open chat drawer, send prompt | Conversational response rendered with cyberpunk typography. |
| 15 | Multi-Provider Selection | Open Settings, switch provider | Provider & model settings persist in localStorage. |
| 16 | Provider Adapters | Test Gemini/OpenAI/Claude/Groq | Request formatted according to each API specification. |
| 17 | Error Handling | Test with invalid key | Clear error message displayed without crashing visual engine. |
| 18 | Standalone Visuals | Run with no AI key | 3D particle sphere, hand tracking, and local voice commands work 100%. |
| 19 | Camera Permission | Grant/deny camera | Graceful fallback to manual & simulation controls if unavailable. |
| 20 | Mobile Optimization | Switch quality LOW / HIGH | Particle count adapts to device performance. |
| 21 | No Fake Success | Test connection failure | Realistic status reporting with no fake affirmations. |
