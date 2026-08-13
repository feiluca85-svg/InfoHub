package com.feiluca85.glancemeteo;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MeteoWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // Aggiorniamo tutti i widget attivi
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
        
        // Imposta la data odierna
        SimpleDateFormat sdf = new SimpleDateFormat("EEEE, d MMMM", Locale.getDefault());
        String currentDate = sdf.format(new Date());
        views.setTextViewText(R.id.widget_date, currentDate);

        // TODO: In futuro qui possiamo aggiungere una chiamata HttpURLConnection 
        // a Open-Meteo per scaricare la temperatura reale e inserirla in widget_weather.
        // Per ora mettiamo un placeholder per testare la UI!
        views.setTextViewText(R.id.widget_weather, "24° Sole");

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
