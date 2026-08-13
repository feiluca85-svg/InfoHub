package com.feiluca85.glancemeteo;

import android.Manifest;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.os.Handler;
import android.os.Looper;
import android.widget.RemoteViews;
import android.widget.Toast;

import androidx.core.content.ContextCompat;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MeteoWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_GPS_REFRESH = "com.feiluca85.glancemeteo.ACTION_GPS_REFRESH";
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();
    private static final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_GPS_REFRESH.equals(intent.getAction())) {
            handleGpsRefresh(context);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private void handleGpsRefresh(Context context) {
        boolean hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;

        if (!hasFine && !hasCoarse) {
            Toast.makeText(context, "Apri l'app Meteo per concedere i permessi GPS", Toast.LENGTH_SHORT).show();
            return;
        }

        Toast.makeText(context, "Ricerca posizione GPS...", Toast.LENGTH_SHORT).show();

        executor.execute(() -> {
            try {
                LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
                Location loc = null;
                if (lm != null) {
                    if (hasFine) {
                        loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                    }
                    if (loc == null && (hasFine || hasCoarse)) {
                        loc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                    }
                    if (loc == null && (hasFine || hasCoarse)) {
                        loc = lm.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER);
                    }
                }

                if (loc != null) {
                    double lat = loc.getLatitude();
                    double lon = loc.getLongitude();
                    String cityName = "Posizione GPS";

                    try {
                        Geocoder geocoder = new Geocoder(context, Locale.ITALIAN);
                        List<Address> addresses = geocoder.getFromLocation(lat, lon, 1);
                        if (addresses != null && !addresses.isEmpty()) {
                            Address addr = addresses.get(0);
                            if (addr.getLocality() != null && !addr.getLocality().isEmpty()) {
                                cityName = addr.getLocality();
                            } else if (addr.getSubAdminArea() != null && !addr.getSubAdminArea().isEmpty()) {
                                cityName = addr.getSubAdminArea();
                            }
                        }
                    } catch (Exception ignored) {}

                    // Save to Capacitor Preferences so app & widget are in sync
                    SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
                    prefs.edit()
                         .putString("ACTIVE_CITY_LAT", String.valueOf(lat))
                         .putString("ACTIVE_CITY_LON", String.valueOf(lon))
                         .putString("ACTIVE_CITY_NAME", cityName)
                         .apply();

                    final String finalCity = cityName;
                    mainHandler.post(() -> Toast.makeText(context, "Posizione trovata: " + finalCity, Toast.LENGTH_SHORT).show());
                } else {
                    mainHandler.post(() -> Toast.makeText(context, "Aggiornamento meteo...", Toast.LENGTH_SHORT).show());
                }

                // Refresh all widgets with new coordinates
                AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
                ComponentName thisWidget = new ComponentName(context, MeteoWidgetProvider.class);
                int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
                for (int id : appWidgetIds) {
                    updateAppWidget(context, appWidgetManager, id);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private static int getDrawableForCode(int code, int isDay) {
        if (code >= 0 && code <= 1) {
            return (isDay == 1) ? R.drawable.ic_sun : R.drawable.ic_moon;
        }
        if (code == 2) {
            return (isDay == 1) ? R.drawable.ic_partly_cloudy : R.drawable.ic_cloud;
        }
        if (code == 3) return R.drawable.ic_cloud;
        if (code >= 45 && code <= 48) return R.drawable.ic_fog;
        if (code >= 51 && code <= 67) return R.drawable.ic_rain;
        if (code >= 71 && code <= 77) return R.drawable.ic_snow;
        if (code >= 80 && code <= 82) return R.drawable.ic_rain;
        if (code >= 95) return R.drawable.ic_storm;
        return (isDay == 1) ? R.drawable.ic_sun : R.drawable.ic_moon;
    }

    private static String getTextForCode(int code) {
        if (code >= 0 && code <= 1) return "Sereno";
        if (code == 2) return "Poco Nuv.";
        if (code == 3) return "Nuvole";
        if (code >= 45 && code <= 48) return "Nebbia";
        if (code >= 51 && code <= 67) return "Pioggia";
        if (code >= 71 && code <= 77) return "Neve";
        if (code >= 80 && code <= 82) return "Acquazzoni";
        if (code >= 95) return "Temporali";
        return "Nuvole";
    }

    static void updateAppWidget(final Context context, final AppWidgetManager appWidgetManager, final int appWidgetId) {
        final RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);

        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        final String latStr = prefs.getString("ACTIVE_CITY_LAT", "45.4642");
        final String lonStr = prefs.getString("ACTIVE_CITY_LON", "9.1900");
        final String cityName = prefs.getString("ACTIVE_CITY_NAME", "Milano");

        // Initial setup for date and city
        SimpleDateFormat sdfDate = new SimpleDateFormat("EEE d.MM", Locale.ITALIAN);
        String currentDate = sdfDate.format(new Date());
        views.setTextViewText(R.id.widget_date, currentDate.substring(0, 1).toUpperCase() + currentDate.substring(1));
        views.setTextViewText(R.id.widget_city, cityName);

        // Click on Weather group / Icon -> Triggers GPS Location & Weather Refresh
        Intent gpsIntent = new Intent(context, MeteoWidgetProvider.class);
        gpsIntent.setAction(ACTION_GPS_REFRESH);
        PendingIntent pendingGps = PendingIntent.getBroadcast(
            context,
            0,
            gpsIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_weather_group, pendingGps);
        views.setOnClickPendingIntent(R.id.widget_main_icon, pendingGps);

        // Click on Clock / Date / City group -> Opens Meteo App
        Intent appIntent = new Intent(context, MainActivity.class);
        PendingIntent pendingApp = PendingIntent.getActivity(
            context,
            1,
            appIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_clock_group, pendingApp);

        appWidgetManager.updateAppWidget(appWidgetId, views);

        executor.execute(() -> {
            try {
                URL url = new URL("https://api.open-meteo.com/v1/forecast?latitude=" + latStr + "&longitude=" + lonStr + "&current_weather=true&timezone=auto");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();

                JSONObject json = new JSONObject(sb.toString());
                JSONObject current = json.getJSONObject("current_weather");
                double temp = current.getDouble("temperature");
                int code = current.getInt("weathercode");
                int isDay = current.optInt("is_day", 1);

                // Update widget texts
                views.setTextViewText(R.id.widget_temp, Math.round(temp) + "°");
                views.setTextViewText(R.id.widget_condition, getTextForCode(code));
                views.setImageViewResource(R.id.widget_main_icon, getDrawableForCode(code, isDay));
                views.setTextViewText(R.id.widget_city, cityName);

                appWidgetManager.updateAppWidget(appWidgetId, views);

            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }
}
