import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  PermissionsAndroid,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  addCalendarChangedListener,
  CalendarAccount,
  CalendarEvent,
  CalendarModule,
} from './src/modules';

const formatDateTime = (value: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

const padNumber = (value: number) => value.toString().padStart(2, '0');

const getDefaultDateInput = () => {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate(),
  )}`;
};

const getDefaultTimeInput = () => {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
};

const parseEventDateTime = (
  dateInput: string,
  timeInput: string,
  durationInput: string,
) => {
  const dateMatch = dateInput.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeInput.trim().match(/^(\d{2}):(\d{2})$/);
  const duration = Number(durationInput);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const [, year, month, day] = dateMatch;
  const [, hour, minute] = timeMatch;
  const startDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );

  const isValidDate =
    startDate.getFullYear() === Number(year) &&
    startDate.getMonth() === Number(month) - 1 &&
    startDate.getDate() === Number(day) &&
    startDate.getHours() === Number(hour) &&
    startDate.getMinutes() === Number(minute);

  if (!isValidDate || !Number.isFinite(duration) || duration <= 0) {
    return null;
  }

  const startTime = startDate.getTime();
  return {
    startDate: startTime,
    endDate: startTime + duration * 60 * 1000,
  };
};

const choosePreferredCalendar = (calendars: CalendarAccount[]) =>
  calendars.find(calendar => calendar.isWritable && calendar.isGoogle && calendar.isPrimary)
    ?.id ??
  calendars.find(calendar => calendar.isWritable && calendar.isGoogle)?.id ??
  calendars.find(calendar => calendar.isWritable && calendar.isVisible)?.id ??
  calendars.find(calendar => calendar.isWritable)?.id ??
  null;

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <CalendarScreen />
    </SafeAreaProvider>
  );
}

function CalendarScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarAccount[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
    null,
  );
  const [title, setTitle] = useState('React Native calendar event');
  const [eventDate, setEventDate] = useState(getDefaultDateInput);
  const [eventTime, setEventTime] = useState(getDefaultTimeInput);
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emptyMessage = useMemo(
    () =>
      hasPermission
        ? 'No events found for this month.'
        : 'Calendar permission is required to read and create events.',
    [hasPermission],
  );

  const requestCalendarPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setHasPermission(false);
      setIsLoading(false);
      setError('CalendarModule is implemented for Android in this sample.');
      return false;
    }

    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
      PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR,
    ]);

    const granted =
      result[PermissionsAndroid.PERMISSIONS.READ_CALENDAR] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      result[PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR] ===
        PermissionsAndroid.RESULTS.GRANTED;

    setHasPermission(granted);
    if (!granted) {
      setIsLoading(false);
      setError('Calendar permission was denied.');
    }
    return granted;
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      const nextEvents = await CalendarModule.getEvents();
      setEvents(nextEvents);
    } catch (exception) {
      const message =
        exception instanceof Error
          ? exception.message
          : 'Unable to load calendar events.';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchCalendars = useCallback(async () => {
    try {
      const nextCalendars = await CalendarModule.getCalendars();
      setCalendars(nextCalendars);
      setSelectedCalendarId(currentCalendarId => {
        if (
          currentCalendarId &&
          nextCalendars.some(calendar => calendar.id === currentCalendarId)
        ) {
          return currentCalendarId;
        }

        return choosePreferredCalendar(nextCalendars);
      });
    } catch (exception) {
      const message =
        exception instanceof Error
          ? exception.message
          : 'Unable to load calendars.';
      setError(message);
    }
  }, []);

  const refreshEvents = useCallback(() => {
    if (!hasPermission) {
      return;
    }

    setIsRefreshing(true);
    fetchEvents();
  }, [fetchEvents, hasPermission]);

  const createEvent = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Title required', 'Enter a title before creating an event.');
      return;
    }

    const eventTimes = parseEventDateTime(
      eventDate,
      eventTime,
      durationMinutes,
    );
    if (!eventTimes) {
      Alert.alert(
        'Check date and time',
        'Use YYYY-MM-DD for the date, HH:mm for the time, and a positive duration.',
      );
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      if (selectedCalendarId) {
        await CalendarModule.addEventToCalendar(
          trimmedTitle,
          eventTimes.startDate,
          eventTimes.endDate,
          selectedCalendarId,
        );
      } else {
        await CalendarModule.addEvent(
          trimmedTitle,
          eventTimes.startDate,
          eventTimes.endDate,
        );
      }
      setTitle('');
      await fetchEvents();
    } catch (exception) {
      const message =
        exception instanceof Error
          ? exception.message
          : 'Unable to create calendar event.';
      setError(message);
      Alert.alert('Event not created', message);
    } finally {
      setIsCreating(false);
    }
  }, [
    durationMinutes,
    eventDate,
    eventTime,
    fetchEvents,
    selectedCalendarId,
    title,
  ]);

  useEffect(() => {
    requestCalendarPermissions().then(granted => {
      if (granted) {
        fetchCalendars();
        fetchEvents();
      }
    });
  }, [fetchCalendars, fetchEvents, requestCalendarPermissions]);

  useEffect(() => {
    if (!hasPermission) {
      return;
    }

    const subscription = addCalendarChangedListener(() => {
      fetchCalendars();
      fetchEvents();
    });

    return () => subscription.remove();
  }, [fetchCalendars, fetchEvents, hasPermission]);

  const renderEvent = ({item}: {item: CalendarEvent}) => (
    <View style={styles.eventRow}>
      <Text style={styles.eventTitle}>{item.title || 'Untitled event'}</Text>
      <Text style={styles.eventTime}>
        {formatDateTime(item.startDate)} - {formatDateTime(item.endDate)}
      </Text>
      {!!item.description && (
        <Text style={styles.eventDescription}>{item.description}</Text>
      )}
      {!!item.calendarName && (
        <Text style={styles.eventCalendar}>
          {item.calendarName}
          {item.accountName ? ` - ${item.accountName}` : ''}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, {paddingTop: safeAreaInsets.top + 18}]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Calendar Events</Text>
        <Text style={styles.subheading}>Current month from Android Calendar</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Event title"
          placeholderTextColor="#6b7280"
          editable={hasPermission && !isCreating}
        />
        <View style={styles.formRow}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            value={eventDate}
            onChangeText={setEventDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#6b7280"
            editable={hasPermission && !isCreating}
            keyboardType="numbers-and-punctuation"
          />
          <TextInput
            style={[styles.input, styles.timeInput]}
            value={eventTime}
            onChangeText={setEventTime}
            placeholder="HH:mm"
            placeholderTextColor="#6b7280"
            editable={hasPermission && !isCreating}
            keyboardType="numbers-and-punctuation"
          />
          <TextInput
            style={[styles.input, styles.durationInput]}
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            placeholder="Minutes"
            placeholderTextColor="#6b7280"
            editable={hasPermission && !isCreating}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.calendarChoices}>
          {calendars
            .filter(calendar => calendar.isWritable)
            .map(calendar => {
              const isSelected = calendar.id === selectedCalendarId;
              return (
                <Pressable
                  key={calendar.id}
                  style={[
                    styles.calendarChoice,
                    isSelected && styles.selectedCalendarChoice,
                  ]}
                  onPress={() => setSelectedCalendarId(calendar.id)}
                  disabled={!hasPermission || isCreating}>
                  <Text
                    style={[
                      styles.calendarChoiceName,
                      isSelected && styles.selectedCalendarChoiceText,
                    ]}
                    numberOfLines={1}>
                    {calendar.name || calendar.accountName || 'Calendar'}
                  </Text>
                  <Text
                    style={[
                      styles.calendarChoiceAccount,
                      isSelected && styles.selectedCalendarChoiceText,
                    ]}
                    numberOfLines={1}>
                    {calendar.isGoogle ? 'Google' : calendar.accountType} -{' '}
                    {calendar.accountName}
                  </Text>
                </Pressable>
              );
            })}
        </View>
        <Button
          title={isCreating ? 'Creating...' : 'Add event'}
          onPress={createEvent}
          disabled={!hasPermission || isCreating}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshEvents}
              enabled={hasPermission}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 18,
  },
  heading: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
  },
  subheading: {
    color: '#4b5563',
    fontSize: 14,
    marginTop: 4,
  },
  form: {
    gap: 10,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  dateInput: {
    flex: 1.35,
  },
  timeInput: {
    flex: 0.85,
  },
  durationInput: {
    flex: 1,
  },
  calendarChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarChoice: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: '48%',
  },
  selectedCalendarChoice: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  calendarChoiceName: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },
  calendarChoiceAccount: {
    color: '#4b5563',
    fontSize: 12,
    marginTop: 3,
  },
  selectedCalendarChoiceText: {
    color: '#ffffff',
  },
  error: {
    color: '#b91c1c',
    fontSize: 14,
    marginBottom: 12,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  eventRow: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  eventTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  eventTime: {
    color: '#2563eb',
    fontSize: 13,
    marginTop: 6,
  },
  eventDescription: {
    color: '#4b5563',
    fontSize: 14,
    marginTop: 8,
  },
  eventCalendar: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
  },
  empty: {
    color: '#4b5563',
    fontSize: 15,
    paddingTop: 32,
    textAlign: 'center',
  },
});

export default App;
