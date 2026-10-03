package com.javialexis.supermania;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/**
 * El juego ocupa toda la pantalla, la pantalla no se apaga mientras se juega y los videos de la tele siguen solos.
 * En segundo plano (otra app, pantalla bloqueada) el WebView se pausa entero: sin dibujo, sin relojes de JavaScript,
 * sin música; al volver sigue donde iba (la página se entera por segundo_plano.ts).
 */
public class MainActivity extends BridgeActivity {

    /** Un momentico para que la página alcance a avisarle al otro celular («salí de la app») antes de dormir. */
    private static final long ESPERA_DORMIR_MS = 700;
    private final Handler manejador = new Handler(Looper.getMainLooper());
    private boolean dormido = false;
    private final Runnable dormir = () -> {
        WebView w = webView();
        if (w == null) return;
        w.pauseTimers();
        dormido = true;
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        // La tele de la casa: el siguiente video de la cola empieza solo, sin tocar la pantalla
        getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        pantallaCompleta();
    }

    @Override
    public void onPause() {
        super.onPause();
        // Capacitor deja el WebView corriendo en segundo plano: aquí se pausa (animaciones, videos, dibujo) y,
        // un instante después, los relojes de JavaScript
        WebView w = webView();
        if (w == null) return;
        w.onPause();
        manejador.removeCallbacks(dormir);
        manejador.postDelayed(dormir, ESPERA_DORMIR_MS);
    }

    @Override
    public void onResume() {
        // Primero se despierta el WebView, así el aviso de «volví» (appStateChange) le llega a una página despierta
        manejador.removeCallbacks(dormir);
        WebView w = webView();
        if (w != null) {
            if (dormido) w.resumeTimers();
            dormido = false;
            w.onResume();
        }
        super.onResume();
    }

    @Override
    public void onDestroy() {
        manejador.removeCallbacks(dormir);
        super.onDestroy();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) pantallaCompleta();
    }

    private WebView webView() {
        return getBridge() != null ? getBridge().getWebView() : null;
    }

    private void pantallaCompleta() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
