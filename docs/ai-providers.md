# ULTRON — Multi-Provider AI Architecture & Configuration

ULTRON features a provider-independent AI architecture with dedicated protocol adapters and zero hardcoded dependencies.

## 1. Supported Providers

| Provider | Default Model | Endpoint Protocol | Authentication |
|---|---|---|---|
| **Google Gemini** | `gemini-2.5-flash` | Direct Google Generative Language REST v1beta | API Key via query param / AI Studio Secrets |
| **OpenAI** | `gpt-4o-mini` | Chat Completions v1 (`api.openai.com`) | Bearer Token |
| **Anthropic Claude** | `claude-3-5-sonnet-20241022` | Messages v1 (`api.anthropic.com`) | `x-api-key` + danger direct browser header |
| **Groq Cloud** | `llama-3.3-70b-versatile` | Ultra low-latency OpenAI-compatible (`api.groq.com`) | Bearer Token |
| **DeepSeek** | `deepseek-chat` | Chat Completions v1 (`api.deepseek.com`) | Bearer Token |
| **Custom Endpoint** | User defined | OpenAI-compatible format | Bearer Token / Custom |

---

## 2. Setting Up in AI Settings
1. Tap the **Settings icon** (gear) in the top-right HUD of the app.
2. Select your desired AI provider from the dropdown.
3. Enter your API key. (For Gemini, if running inside AI Studio, your key is auto-detected from `BuildConfig.GEMINI_API_KEY`).
4. Tap **"TEST PROVIDER CONNECTION"**. The engine will execute a low-latency test ping and display the status.
5. All settings are securely persisted in local device storage.
