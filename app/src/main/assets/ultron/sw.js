const CACHE_NAME = 'ultron-core-v2.5';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './manifest.webmanifest',
  './libs/three.min.js',
  './libs/camera_utils.js',
  './libs/hands.js',
  './js/config.js',
  './js/app.js',
  './js/core/event-bus.js',
  './js/core/state-manager.js',
  './js/graphics/particle-shaders.js',
  './js/graphics/particle-shapes.js',
  './js/graphics/particle-engine.js',
  './js/vision/camera-manager.js',
  './js/vision/hand-tracker.js',
  './js/voice/command-parser.js',
  './js/voice/speech-output.js',
  './js/voice/speech-recognition.js',
  './js/assistant/provider-registry.js',
  './js/assistant/chat-manager.js',
  './js/ui/hud-manager.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Do not cache external AI API requests or streaming responses
  if (e.request.url.includes('googleapis.com') ||
      e.request.url.includes('api.openai.com') ||
      e.request.url.includes('api.anthropic.com') ||
      e.request.url.includes('api.groq.com') ||
      e.request.url.includes('api.deepseek.com')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
