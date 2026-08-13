package com.feiluca85.glancemeteo;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MeteoWidgetProvider extends AppWidgetProvider {
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private static int getDrawableForCode(int code) {
        if (code >= 0 && code <= 1) return R.drawable.ic_sun;
        if (code == 2) return R.drawable.ic_partly_cloudy;
        if (code == 3) return R.drawable.ic_cloud;
        if (code >= 45 && code <= 48) return R.drawable.ic_fog;
        if (code >= 51 && code <= 67) return R.drawable.ic_rain;
        if (code >= 71 && code <= 77) return R.drawable.ic_snow;
        if (code >= 80 && code <= 82) return R.drawable.ic_rain;
        if (code >= 95) return R.drawable.ic_storm;
        return R.drawable.ic_cloud;
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

    private static String getDayName(int offsetDays) {
        long time = System.currentTimeMillis() + (offsetDays * 86400000L);
        SimpleDateFormat sdf = new SimpleDateFormat("EEE", Locale.ITALIAN);
        return sdf.format(new Date(time)).toUpperCase();
    }

    static void updateAppWidget(final Context context, final AppWidgetManager appWidgetManager, final int appWidgetId) {
        final RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
        
        android.content.SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        final String latStr = prefs.getString("ACTIVE_CITY_LAT", "45.4642");
        final String lonStr = prefs.getString("ACTIVE_CITY_LON", "9.1900");
        final String cityName = prefs.getString("ACTIVE_CITY_NAME", "Milano");

        // Initial setup for date
        SimpleDateFormat sdfDate = new SimpleDateFormat("EEE d.MM", Locale.ITALIAN);
        String currentDate = sdfDate.format(new Date());
        views.setTextViewText(R.id.widget_date, currentDate.substring(0, 1).toUpperCase() + currentDate.substring(1));
        views.setTextViewText(R.id.widget_city, cityName);
        
        appWidgetManager.updateAppWidget(appWidgetId, views);

        executor.execute(() -> {
            try {
                URL url = new URL("https://api.open-meteo.com/v1/forecast?latitude=" + latStr + "&longitude=" + lonStr + "&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
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
                
                JSONObject daily = json.getJSONObject("daily");
                JSONArray dailyCodes = daily.getJSONArray("weathercode");
                JSONArray dailyMax = daily.getJSONArray("temperature_2m_max");
                JSONArray dailyMin = daily.getJSONArray("temperature_2m_min");
                
                // Current
                views.setTextViewText(R.id.widget_temp, Math.round(temp) + "°");
                views.setTextViewText(R.id.widget_condition, getTextForCode(code));
                views.setImageViewResource(R.id.widget_main_icon, getDrawableForCode(code));
                
                // Day 1 (Tomorrow)
                views.setTextViewText(R.id.widget_day1_name, getDayName(1));
                views.setImageViewResource(R.id.widget_day1_icon, getDrawableForCode(dailyCodes.getInt(1)));
                views.setTextViewText(R.id.widget_day1_temps, Math.round(dailyMin.getDouble(1)) + "/" + Math.round(dailyMax.getDouble(1)) + "°");

                // Day 2
                views.setTextViewText(R.id.widget_day2_name, getDayName(2));
                views.setImageViewResource(R.id.widget_day2_icon, getDrawableForCode(dailyCodes.getInt(2)));
                views.setTextViewText(R.id.widget_day2_temps, Math.round(dailyMin.getDouble(2)) + "/" + Math.round(dailyMax.getDouble(2)) + "°");

                // Day 3
                views.setTextViewText(R.id.widget_day3_name, getDayName(3));
                views.setImageViewResource(R.id.widget_day3_icon, getDrawableForCode(dailyCodes.getInt(3)));
                views.setTextViewText(R.id.widget_day3_temps, Math.round(dailyMin.getDouble(3)) + "/" + Math.round(dailyMax.getDouble(3)) + "°");
                
                appWidgetManager.updateAppWidget(appWidgetId, views);

            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }
}
