package com.feiluca85.glancemeteo;

import android.Manifest;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Force black status bar natively (override any MIUI/Capacitor themes)
        getWindow().setStatusBarColor(android.graphics.Color.BLACK);
        
        // Richiedi i permessi GPS all'avvio in modo nativo
        requestPermissions(new String[]{Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, 1);
    }
}
