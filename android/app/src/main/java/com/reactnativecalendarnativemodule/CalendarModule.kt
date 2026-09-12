package com.reactnativecalendarnativemodule

import android.Manifest
import android.content.ContentUris
import android.content.ContentValues
import android.content.pm.PackageManager
import android.database.ContentObserver
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.provider.CalendarContract
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Calendar
import java.util.TimeZone

class CalendarModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var calendarObserver: ContentObserver? = null
    private var listenerCount = 0

    override fun getName() = NAME

    @ReactMethod
    fun getEvents(promise: Promise) {
        if (!hasPermission(Manifest.permission.READ_CALENDAR)) {
            promise.reject("E_CALENDAR_PERMISSION", "READ_CALENDAR permission has not been granted")
            return
        }

        try {
            val startOfMonth = Calendar.getInstance().apply {
                set(Calendar.DAY_OF_MONTH, 1)
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            val endOfMonth = (startOfMonth.clone() as Calendar).apply {
                add(Calendar.MONTH, 1)
            }

            val events = Arguments.createArray()
            val instancesUri = CalendarContract.Instances.CONTENT_URI.buildUpon()
                .appendPath(startOfMonth.timeInMillis.toString())
                .appendPath(endOfMonth.timeInMillis.toString())
                .build()
            val projection = arrayOf(
                CalendarContract.Instances.EVENT_ID,
                CalendarContract.Instances.TITLE,
                CalendarContract.Instances.DESCRIPTION,
                CalendarContract.Instances.BEGIN,
                CalendarContract.Instances.END,
                CalendarContract.Instances.CALENDAR_ID,
                CalendarContract.Instances.CALENDAR_DISPLAY_NAME
            )
            val sortOrder = "${CalendarContract.Instances.BEGIN} ASC"

            reactContext.contentResolver.query(
                instancesUri,
                projection,
                null,
                null,
                sortOrder
            )?.use { cursor ->
                val idIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.EVENT_ID)
                val titleIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.TITLE)
                val descriptionIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.DESCRIPTION)
                val startIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.BEGIN)
                val endIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.END)
                val calendarIdIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.CALENDAR_ID)
                val calendarNameIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.CALENDAR_DISPLAY_NAME)

                while (cursor.moveToNext()) {
                    val eventId = cursor.getLong(idIndex).toString()
                    val startDate = cursor.getLong(startIndex)
                    val event = Arguments.createMap()
                    event.putString("id", "$eventId:$startDate")
                    event.putString("eventId", eventId)
                    event.putString("title", cursor.getString(titleIndex).orEmpty())
                    event.putString("description", cursor.getString(descriptionIndex).orEmpty())
                    event.putDouble("startDate", startDate.toDouble())
                    event.putDouble("endDate", cursor.getLong(endIndex).toDouble())
                    event.putString("calendarId", cursor.getLong(calendarIdIndex).toString())
                    event.putString("calendarName", cursor.getString(calendarNameIndex).orEmpty())
                    events.pushMap(event)
                }
            }

            promise.resolve(events)
        } catch (exception: Exception) {
            promise.reject("E_GET_EVENTS_FAILED", "Failed to query calendar events", exception)
        }
    }

    @ReactMethod
    fun getCalendars(promise: Promise) {
        if (!hasPermission(Manifest.permission.READ_CALENDAR)) {
            promise.reject("E_CALENDAR_PERMISSION", "READ_CALENDAR permission has not been granted")
            return
        }

        try {
            promise.resolve(queryCalendars())
        } catch (exception: Exception) {
            promise.reject("E_GET_CALENDARS_FAILED", "Failed to query calendars", exception)
        }
    }

    @ReactMethod
    fun addEvent(title: String, startDate: Double, endDate: Double, promise: Promise) {
        addEventToSelectedCalendar(title, startDate, endDate, null, promise)
    }

    @ReactMethod
    fun addEventToCalendar(
        title: String,
        startDate: Double,
        endDate: Double,
        calendarId: String,
        promise: Promise
    ) {
        addEventToSelectedCalendar(title, startDate, endDate, calendarId, promise)
    }

    private fun addEventToSelectedCalendar(
        title: String,
        startDate: Double,
        endDate: Double,
        calendarId: String?,
        promise: Promise
    ) {
        if (!hasPermission(Manifest.permission.READ_CALENDAR) || !hasPermission(Manifest.permission.WRITE_CALENDAR)) {
            promise.reject("E_CALENDAR_PERMISSION", "READ_CALENDAR and WRITE_CALENDAR permissions must be granted")
            return
        }

        if (title.isBlank()) {
            promise.reject("E_INVALID_EVENT", "Event title is required")
            return
        }

        if (endDate <= startDate) {
            promise.reject("E_INVALID_EVENT", "Event endDate must be after startDate")
            return
        }

        try {
            val resolvedCalendarId = calendarId?.toLongOrNull() ?: getOrCreateWritableCalendarId()
            if (resolvedCalendarId == null) {
                promise.reject("E_NO_CALENDAR", "No writable calendar could be found or created on this device")
                return
            }

            val values = ContentValues().apply {
                put(CalendarContract.Events.CALENDAR_ID, resolvedCalendarId)
                put(CalendarContract.Events.TITLE, title)
                put(CalendarContract.Events.DTSTART, startDate.toLong())
                put(CalendarContract.Events.DTEND, endDate.toLong())
                put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().id)
            }

            val eventUri = reactContext.contentResolver.insert(CalendarContract.Events.CONTENT_URI, values)
            if (eventUri == null) {
                promise.reject("E_ADD_EVENT_FAILED", "Calendar provider did not return a new event URI")
                return
            }

            promise.resolve(ContentUris.parseId(eventUri).toString())
        } catch (exception: Exception) {
            promise.reject("E_ADD_EVENT_FAILED", "Failed to add calendar event", exception)
        }
    }

    @ReactMethod
    fun startObserving() {
        if (calendarObserver != null || !hasPermission(Manifest.permission.READ_CALENDAR)) {
            return
        }

        calendarObserver = object : ContentObserver(Handler(Looper.getMainLooper())) {
            override fun onChange(selfChange: Boolean) {
                super.onChange(selfChange)
                emitCalendarChanged(null)
            }

            override fun onChange(selfChange: Boolean, uri: Uri?) {
                emitCalendarChanged(uri)
            }
        }

        reactContext.contentResolver.registerContentObserver(
            CalendarContract.Events.CONTENT_URI,
            true,
            calendarObserver as ContentObserver
        )
    }

    @ReactMethod
    fun stopObserving() {
        calendarObserver?.let {
            reactContext.contentResolver.unregisterContentObserver(it)
            calendarObserver = null
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        listenerCount += 1
        if (eventName == CALENDAR_CHANGED_EVENT) {
            startObserving()
        }
    }

    @ReactMethod
    fun removeListeners(count: Double) {
        listenerCount = (listenerCount - count.toInt()).coerceAtLeast(0)
        if (listenerCount == 0) {
            stopObserving()
        }
    }

    override fun invalidate() {
        stopObserving()
        super.invalidate()
    }

    private fun getOrCreateWritableCalendarId(): Long? =
        findWritableCalendarId() ?: createLocalCalendar()

    private fun findWritableCalendarId(): Long? {
        val projection = arrayOf(
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.VISIBLE,
            CalendarContract.Calendars.IS_PRIMARY,
            CalendarContract.Calendars.ACCOUNT_TYPE
        )
        val selection = "${CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL} >= ?"
        val selectionArgs = arrayOf(CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR.toString())

        var firstWritableCalendarId: Long? = null
        var firstVisibleCalendarId: Long? = null
        var firstGoogleCalendarId: Long? = null

        reactContext.contentResolver.query(
            CalendarContract.Calendars.CONTENT_URI,
            projection,
            selection,
            selectionArgs,
            "${CalendarContract.Calendars.IS_PRIMARY} DESC"
        )?.use { cursor ->
            val idIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars._ID)
            val visibleIndex = cursor.getColumnIndex(CalendarContract.Calendars.VISIBLE)
            val primaryIndex = cursor.getColumnIndex(CalendarContract.Calendars.IS_PRIMARY)
            val accountTypeIndex = cursor.getColumnIndex(CalendarContract.Calendars.ACCOUNT_TYPE)

            while (cursor.moveToNext()) {
                val calendarId = cursor.getLong(idIndex)
                val isVisible = visibleIndex < 0 || cursor.getInt(visibleIndex) == 1
                val accountType = cursor.getString(accountTypeIndex).orEmpty()
                if (firstWritableCalendarId == null) {
                    firstWritableCalendarId = calendarId
                }
                if (firstVisibleCalendarId == null && isVisible) {
                    firstVisibleCalendarId = calendarId
                }
                if (firstGoogleCalendarId == null && isVisible && accountType == GOOGLE_ACCOUNT_TYPE) {
                    firstGoogleCalendarId = calendarId
                }
                if (isVisible && accountType == GOOGLE_ACCOUNT_TYPE && primaryIndex >= 0 && cursor.getInt(primaryIndex) == 1) {
                    return calendarId
                }
            }
        }

        return firstGoogleCalendarId ?: firstVisibleCalendarId ?: firstWritableCalendarId
    }

    private fun queryCalendars() = Arguments.createArray().apply {
        val projection = arrayOf(
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
            CalendarContract.Calendars.ACCOUNT_NAME,
            CalendarContract.Calendars.ACCOUNT_TYPE,
            CalendarContract.Calendars.OWNER_ACCOUNT,
            CalendarContract.Calendars.VISIBLE,
            CalendarContract.Calendars.IS_PRIMARY,
            CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL
        )

        reactContext.contentResolver.query(
            CalendarContract.Calendars.CONTENT_URI,
            projection,
            null,
            null,
            "${CalendarContract.Calendars.ACCOUNT_TYPE} ASC, ${CalendarContract.Calendars.IS_PRIMARY} DESC"
        )?.use { cursor ->
            val idIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars._ID)
            val nameIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME)
            val accountNameIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.ACCOUNT_NAME)
            val accountTypeIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.ACCOUNT_TYPE)
            val ownerAccountIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.OWNER_ACCOUNT)
            val visibleIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.VISIBLE)
            val primaryIndex = cursor.getColumnIndex(CalendarContract.Calendars.IS_PRIMARY)
            val accessLevelIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL)

            while (cursor.moveToNext()) {
                val accessLevel = cursor.getInt(accessLevelIndex)
                val accountType = cursor.getString(accountTypeIndex).orEmpty()
                val calendar = Arguments.createMap()
                calendar.putString("id", cursor.getLong(idIndex).toString())
                calendar.putString("name", cursor.getString(nameIndex).orEmpty())
                calendar.putString("accountName", cursor.getString(accountNameIndex).orEmpty())
                calendar.putString("accountType", accountType)
                calendar.putString("ownerAccount", cursor.getString(ownerAccountIndex).orEmpty())
                calendar.putBoolean("isGoogle", accountType == GOOGLE_ACCOUNT_TYPE)
                calendar.putBoolean("isVisible", cursor.getInt(visibleIndex) == 1)
                calendar.putBoolean("isPrimary", primaryIndex >= 0 && cursor.getInt(primaryIndex) == 1)
                calendar.putBoolean(
                    "isWritable",
                    accessLevel >= CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR
                )
                calendar.putDouble("accessLevel", accessLevel.toDouble())
                pushMap(calendar)
            }
        }
    }

    private fun createLocalCalendar(): Long? {
        val calendarUri = CalendarContract.Calendars.CONTENT_URI.buildUpon()
            .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
            .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, LOCAL_CALENDAR_ACCOUNT_NAME)
            .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, CalendarContract.ACCOUNT_TYPE_LOCAL)
            .build()

        val values = ContentValues().apply {
            put(CalendarContract.Calendars.ACCOUNT_NAME, LOCAL_CALENDAR_ACCOUNT_NAME)
            put(CalendarContract.Calendars.ACCOUNT_TYPE, CalendarContract.ACCOUNT_TYPE_LOCAL)
            put(CalendarContract.Calendars.NAME, LOCAL_CALENDAR_NAME)
            put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, LOCAL_CALENDAR_DISPLAY_NAME)
            put(CalendarContract.Calendars.CALENDAR_COLOR, LOCAL_CALENDAR_COLOR)
            put(CalendarContract.Calendars.CALENDAR_TIME_ZONE, TimeZone.getDefault().id)
            put(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL, CalendarContract.Calendars.CAL_ACCESS_OWNER)
            put(CalendarContract.Calendars.OWNER_ACCOUNT, LOCAL_CALENDAR_ACCOUNT_NAME)
            put(CalendarContract.Calendars.VISIBLE, 1)
            put(CalendarContract.Calendars.SYNC_EVENTS, 1)
        }

        val uri = reactContext.contentResolver.insert(calendarUri, values) ?: return null
        return ContentUris.parseId(uri)
    }

    private fun hasPermission(permission: String): Boolean =
        reactContext.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED

    private fun emitCalendarChanged(uri: Uri?) {
        if (!reactContext.hasActiveReactInstance()) {
            return
        }

        val payload = Arguments.createMap().apply {
            putString("uri", uri?.toString())
        }

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(CALENDAR_CHANGED_EVENT, payload)
    }

    companion object {
        private const val NAME = "CalendarModule"
        private const val CALENDAR_CHANGED_EVENT = "onCalendarChanged"
        private const val GOOGLE_ACCOUNT_TYPE = "com.google"
        private const val LOCAL_CALENDAR_ACCOUNT_NAME = "react-native-calendar-native-module"
        private const val LOCAL_CALENDAR_NAME = "react_native_calendar_events"
        private const val LOCAL_CALENDAR_DISPLAY_NAME = "React Native Calendar"
        private const val LOCAL_CALENDAR_COLOR = -0xD06612
    }
}
