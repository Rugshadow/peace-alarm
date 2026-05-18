package com.roosteralarm.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class AlarmActionReceiver : BroadcastReceiver() {
    companion object {
        const val ACTION_DISMISS = "com.roosteralarm.app.ALARM_DISMISS"
        const val ACTION_SNOOZE = "com.roosteralarm.app.ALARM_SNOOZE"
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d("RoosterAlarm", "AlarmActionReceiver: action=${intent.action}")

        val channelId = intent.getStringExtra("channelId") ?: ""
        val channelName = intent.getStringExtra("channelName") ?: "Alarm"
        val channelImageUrl = intent.getStringExtra("channelImageUrl") ?: ""
        val alarmId = intent.getStringExtra("alarmId") ?: "unknown"

        // Clear alarm data so JS doesn't re-trigger the popup on next resume
        context.getSharedPreferences("peace_alarm_prefs", Context.MODE_PRIVATE).edit()
            .remove("alarm_channel_id")
            .remove("alarm_channel_name")
            .remove("alarm_channel_image_url")
            .apply()

        // Stop the alarm service (stops audio and removes the foreground notification)
        context.stopService(Intent(context, AlarmService::class.java))

        if (intent.action == ACTION_SNOOZE && channelId.isNotEmpty()) {
            val snoozeId = "${alarmId}_snooze"
            val triggerMs = System.currentTimeMillis() + 5 * 60 * 1000L

            val receiverIntent = Intent(context, AlarmReceiver::class.java).apply {
                putExtra("alarmId", snoozeId)
                putExtra("channelId", channelId)
                putExtra("channelName", channelName)
                putExtra("channelImageUrl", channelImageUrl)
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context, snoozeId.hashCode(), receiverIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val showIntent = Intent(context, MainActivity::class.java)
            val showPi = PendingIntent.getActivity(
                context, snoozeId.hashCode() + 1, showIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmManager.setAlarmClock(AlarmManager.AlarmClockInfo(triggerMs, showPi), pendingIntent)
            Log.d("RoosterAlarm", "AlarmActionReceiver: snoozed alarm $alarmId for 5 minutes")
        } else {
            Log.d("RoosterAlarm", "AlarmActionReceiver: dismissed alarm $alarmId")
        }
    }
}
