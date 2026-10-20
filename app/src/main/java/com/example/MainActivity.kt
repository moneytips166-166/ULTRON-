package com.example

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.example.ui.theme.MyApplicationTheme
import java.util.Locale

class MainActivity : ComponentActivity(), TextToSpeech.OnInitListener {

  private var tts: TextToSpeech? = null
  private var isTtsReady = false
  private var speechRecognizer: SpeechRecognizer? = null
  private var webView: WebView? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    // Initialize TextToSpeech
    tts = TextToSpeech(this, this)

    setContent {
      MyApplicationTheme {
        Surface(
          modifier = Modifier.fillMaxSize(),
          color = Color(0xFF030712)
        ) {
          UltronScreen(
            onWebViewCreated = { wv -> webView = wv },
            activity = this@MainActivity
          )
        }
      }
    }
  }

  override fun onInit(status: Int) {
    if (status == TextToSpeech.SUCCESS) {
      val result = tts?.setLanguage(Locale.US)
      if (result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED) {
        tts?.setPitch(0.95f)
        tts?.setSpeechRate(1.05f)
        isTtsReady = true
      }
    }
  }

  fun speakText(text: String) {
    if (isTtsReady) {
      tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ultron_speech")
    }
  }

  fun stopSpeaking() {
    if (isTtsReady) {
      tts?.stop()
    }
  }

  fun startNativeSpeechRecognition() {
    runOnUiThread {
      if (speechRecognizer == null) {
        if (SpeechRecognizer.isRecognitionAvailable(this)) {
          speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
        }
      }

      val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.US.toLanguageTag())
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
      }

      speechRecognizer?.setRecognitionListener(object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {}
        override fun onBeginningOfSpeech() {}
        override fun onRmsChanged(rmsdB: Float) {}
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() {}
        override fun onError(error: Int) {
          webView?.post {
            webView?.evaluateJavascript(
              "if (window.ultronOnNativeSpeechResult) window.ultronOnNativeSpeechResult('', true);",
              null
            )
          }
        }

        override fun onResults(results: Bundle?) {
          val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
          val text = matches?.firstOrNull() ?: ""
          webView?.post {
            val escaped = text.replace("'", "\\'")
            webView?.evaluateJavascript(
              "if (window.ultronOnNativeSpeechResult) window.ultronOnNativeSpeechResult('$escaped', true);",
              null
            )
          }
        }

        override fun onPartialResults(partialResults: Bundle?) {
          val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
          val text = matches?.firstOrNull() ?: ""
          webView?.post {
            val escaped = text.replace("'", "\\'")
            webView?.evaluateJavascript(
              "if (window.ultronOnNativeSpeechResult) window.ultronOnNativeSpeechResult('$escaped', false);",
              null
            )
          }
        }

        override fun onEvent(eventType: Int, params: Bundle?) {}
      })

      speechRecognizer?.startListening(intent)
    }
  }

  fun stopNativeSpeechRecognition() {
    runOnUiThread {
      speechRecognizer?.stopListening()
    }
  }

  fun triggerHapticFeedback(durationMs: Long) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
        val vibrator = vibratorManager?.defaultVibrator
        vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
      } else {
        @Suppress("DEPRECATION")
        val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        @Suppress("DEPRECATION")
        vibrator?.vibrate(durationMs)
      }
    } catch (_: Exception) {}
  }

  override fun onDestroy() {
    super.onDestroy()
    tts?.stop()
    tts?.shutdown()
    speechRecognizer?.destroy()
    webView?.destroy()
  }
}

class UltronAndroidBridge(
  private val activity: MainActivity,
  private val onRequestCamera: () -> Unit
) {

  @JavascriptInterface
  fun getGeminiApiKey(): String {
    val key = BuildConfig.GEMINI_API_KEY
    return if (key == "MY_GEMINI_API_KEY" || key.isBlank()) "" else key
  }

  @JavascriptInterface
  fun speak(text: String) {
    activity.speakText(text)
  }

  @JavascriptInterface
  fun stopSpeaking() {
    activity.stopSpeaking()
  }

  @JavascriptInterface
  fun startSpeech() {
    activity.startNativeSpeechRecognition()
  }

  @JavascriptInterface
  fun stopSpeech() {
    activity.stopNativeSpeechRecognition()
  }

  @JavascriptInterface
  fun vibrate(durationMs: Long) {
    activity.triggerHapticFeedback(durationMs)
  }

  @JavascriptInterface
  fun hasCameraPermission(): Boolean {
    return ContextCompat.checkSelfPermission(
      activity,
      Manifest.permission.CAMERA
    ) == PackageManager.PERMISSION_GRANTED
  }

  @JavascriptInterface
  fun requestCameraPermission() {
    onRequestCamera()
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun UltronScreen(
  onWebViewCreated: (WebView) -> Unit,
  activity: MainActivity
) {
  val context = LocalContext.current

  // Permission Launcher for Camera and Audio recording
  val permissionLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.RequestMultiplePermissions()
  ) { _ ->
    // Permissions handled
  }

  LaunchedEffect(Unit) {
    val neededPermissions = mutableListOf<String>()
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
      neededPermissions.add(Manifest.permission.CAMERA)
    }
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      neededPermissions.add(Manifest.permission.RECORD_AUDIO)
    }
    if (neededPermissions.isNotEmpty()) {
      permissionLauncher.launch(neededPermissions.toTypedArray())
    }
  }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(Color(0xFF030712))
  ) {
    AndroidView(
      modifier = Modifier.fillMaxSize(),
      factory = { ctx ->
        WebView(ctx).apply {
          layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
          )

          // Hardware acceleration
          setLayerType(View.LAYER_TYPE_HARDWARE, null)
          setBackgroundColor(0xFF030712.toInt())

          settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
            loadsImagesAutomatically = true
            useWideViewPort = true
            loadWithOverviewMode = true
          }

          webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
              // Automatically grant WebRTC camera and microphone streams
              activity.runOnUiThread {
                request.grant(request.resources)
              }
            }
          }

          webViewClient = object : WebViewClient() {}

          val bridge = UltronAndroidBridge(
            activity = activity,
            onRequestCamera = {
              activity.runOnUiThread {
                permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA))
              }
            }
          )
          addJavascriptInterface(bridge, "AndroidBridge")

          loadUrl("file:///android_asset/ultron/index.html")
          onWebViewCreated(this)
        }
      }
    )
  }
}
