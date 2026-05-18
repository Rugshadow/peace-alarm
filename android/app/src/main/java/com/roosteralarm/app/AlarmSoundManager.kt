package com.roosteralarm.app

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.util.Log

object AlarmSoundManager {
    @Volatile private var player: MediaPlayer? = null
    private var focusRequest: AudioFocusRequest? = null
    @Volatile var alarmVolume: Float = 1.0f

    private fun curveVolume(v: Float): Float = v * v

    @Synchronized fun isPlaying(): Boolean = player != null
    @Synchronized fun getCurrentPositionMs(): Int = try { player?.currentPosition ?: 0 } catch (_: Exception) { 0 }

    @Synchronized fun stop() {
        val trace = Log.getStackTraceString(Throwable()).lines().take(8).joinToString("\n")
        Log.d("RoosterAlarm", "AlarmSoundManager.stop() called, player=${player != null}\n$trace")
        player?.apply {
            try {
                setOnPreparedListener(null)
                setOnErrorListener(null)
                setOnCompletionListener(null)
                if (isPlaying) stop()
            } catch (e: Exception) { Log.e("RoosterAlarm", "AlarmSoundManager.stop error: ${e.message}") }
            release()
        }
        player = null
    }

    // Called from IntentModule (app in foreground) — USAGE_MEDIA so setVolume() is honoured
    @Synchronized fun playUrlForeground(context: Context, url: String, onError: () -> Unit) {
        Log.d("RoosterAlarm", "AlarmSoundManager.playUrlForeground() url=$url volume=$alarmVolume")
        stop()
        try {
            // Set media stream to max so mp.setVolume() scales across the full range
            try {
                val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
                val max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
                am.setStreamVolume(AudioManager.STREAM_MUSIC, max, 0)
            } catch (e: Exception) {
                Log.w("RoosterAlarm", "playUrlForeground: could not set stream volume: ${e.message}")
            }
            requestAudioFocus(context)
            val vol = alarmVolume
            val attr = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()
            val mp = MediaPlayer()
            mp.setAudioAttributes(attr)
            mp.setVolume(curveVolume(vol), curveVolume(vol))
            mp.setDataSource(url)
            mp.isLooping = true
            mp.setOnErrorListener { _, what, extra ->
                Log.e("RoosterAlarm", "AlarmSoundManager: MediaPlayer error what=$what extra=$extra")
                onError()
                true
            }
            mp.setOnPreparedListener {
                it.setVolume(curveVolume(vol), curveVolume(vol))
                Log.d("RoosterAlarm", "AlarmSoundManager: onPrepared start() vol=$vol")
                it.start()
            }
            mp.prepareAsync()
            player = mp
        } catch (e: Exception) {
            Log.e("RoosterAlarm", "AlarmSoundManager.playUrlForeground exception: ${e.message}", e)
            onError()
        }
    }

    // Called from AlarmService (background) — USAGE_ALARM for lock screen / DND bypass
    @Synchronized fun playUrl(context: Context, url: String, onError: () -> Unit) {
        Log.d("RoosterAlarm", "AlarmSoundManager.playUrl() url=$url volume=$alarmVolume")
        stop()
        try {
            requestAudioFocus(context)
            val vol = alarmVolume
            val attr = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()
            val mp = MediaPlayer()
            mp.setAudioAttributes(attr)
            mp.setVolume(curveVolume(vol), curveVolume(vol))
            mp.setDataSource(url)
            mp.isLooping = true
            mp.setOnErrorListener { _, what, extra ->
                Log.e("RoosterAlarm", "AlarmSoundManager: MediaPlayer error what=$what extra=$extra")
                onError()
                true
            }
            mp.setOnPreparedListener {
                it.setVolume(curveVolume(vol), curveVolume(vol))
                Log.d("RoosterAlarm", "AlarmSoundManager: onPrepared start() vol=$vol")
                it.start()
            }
            mp.prepareAsync()
            player = mp
        } catch (e: Exception) {
            Log.e("RoosterAlarm", "AlarmSoundManager.playUrl exception: ${e.message}", e)
            onError()
        }
    }

    @Synchronized fun playFallback(context: Context, soundName: String = "alarm") {
        Log.d("RoosterAlarm", "AlarmSoundManager.playFallback() sound=$soundName volume=$alarmVolume")
        stop()
        try {
            requestAudioFocus(context)
            val vol = alarmVolume
            val attr = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            val resId = context.resources.getIdentifier(soundName, "raw", context.packageName)
            val uri = if (resId != 0) Uri.parse("android.resource://${context.packageName}/$resId")
                      else Uri.parse("android.resource://${context.packageName}/raw/alarm")
            val mp = MediaPlayer()
            mp.setAudioAttributes(attr)
            mp.setVolume(curveVolume(vol), curveVolume(vol))
            mp.setDataSource(context, uri)
            mp.isLooping = true
            mp.setOnPreparedListener { it.setVolume(curveVolume(vol), curveVolume(vol)); it.start() }
            mp.prepare()
            mp.start()
            Log.d("RoosterAlarm", "AlarmSoundManager: fallback started vol=$vol")
            player = mp
        } catch (e: Exception) {
            Log.e("RoosterAlarm", "AlarmSoundManager.playFallback exception: ${e.message}", e)
        }
    }

    private fun requestAudioFocus(context: Context) {
        val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .build()
                )
                .setAcceptsDelayedFocusGain(false)
                .build()
            val result = am.requestAudioFocus(req)
            Log.d("RoosterAlarm", "AlarmSoundManager: requestAudioFocus result=$result")
            focusRequest = req
        } else {
            @Suppress("DEPRECATION")
            val result = am.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN)
            Log.d("RoosterAlarm", "AlarmSoundManager: requestAudioFocus (legacy) result=$result")
        }
    }
}
