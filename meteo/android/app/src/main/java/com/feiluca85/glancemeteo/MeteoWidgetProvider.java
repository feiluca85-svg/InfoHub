package com.feiluca85.glancemeteo;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;

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

    static void updateAppWidget(final Context context, final AppWidgetManager appWidgetManager, final int appWidgetId) {
        final RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
        
        SimpleDateFormat sdf = new SimpleDateFormat("EEEE, d MMMM", Locale.getDefault());
        String currentDate = sdf.format(new Date());
        views.setTextViewText(R.id.widget_date, currentDate);
        
        // Push state
        appWidgetManager.updateAppWidget(appWidgetId, views);

        executor.execute(() -> {
            try {
                // Impostiamo coordinate fisse (Milano) come fallback se l'app non le ha ancora passate.
                URL url = new URL("https://api.open-meteo.com/v1/forecast?latitude=45.4642&longitude=9.1900&current_weather=true");
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
                
                String weatherStr = "Sereno";
                if (code >= 1 && code <= 3) weatherStr = "Nuvole";
                else if (code >= 45 && code <= 48) weatherStr = "Nebbia";
                else if (code >= 51 && code <= 67) weatherStr = "Pioggia";
                else if (code >= 71 && code <= 77) weatherStr = "Neve";
                else if (code >= 95) weatherStr = "Temporale";

                String finalString = Math.round(temp) + "° " + weatherStr;
                
                views.setTextViewText(R.id.widget_weather, finalString);
                appWidgetManager.updateAppWidget(appWidgetId, views);

            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }
}
