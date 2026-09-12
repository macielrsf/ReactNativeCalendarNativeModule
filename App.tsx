import React, {useEffect, useMemo} from 'react';
import {StatusBar, StyleSheet, Text, useColorScheme, View} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  CalendarEventForm,
  CalendarEventList,
  CalendarHeader,
} from './src/components';
import {
  useCalendarData,
  useCalendarEventForm,
  useCalendarPermissions,
} from './src/hooks';

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
  const {
    hasPermission,
    isRequesting,
    permissionError,
    requestCalendarPermissions,
  } = useCalendarPermissions();
  const {
    calendars,
    error: dataError,
    events,
    isLoading: isDataLoading,
    isRefreshing,
    refreshEvents,
    selectedCalendarId,
    setSelectedCalendarId,
  } = useCalendarData(hasPermission);
  const eventForm = useCalendarEventForm({
    onCreated: refreshEvents,
    selectedCalendarId,
  });

  useEffect(() => {
    requestCalendarPermissions();
  }, [requestCalendarPermissions]);

  const emptyMessage = useMemo(
    () =>
      hasPermission
        ? 'No events found for this month.'
        : 'Calendar permission is required to read and create events.',
    [hasPermission],
  );
  const error = eventForm.error || permissionError || dataError;

  return (
    <View style={[styles.container, {paddingTop: safeAreaInsets.top + 18}]}>
      <CalendarHeader />
      <CalendarEventForm
        calendars={calendars}
        durationMinutes={eventForm.durationMinutes}
        eventDate={eventForm.eventDate}
        eventTime={eventForm.eventTime}
        hasPermission={hasPermission}
        isCreating={eventForm.isCreating}
        selectedCalendarId={selectedCalendarId}
        title={eventForm.title}
        onChangeDate={eventForm.setEventDate}
        onChangeDuration={eventForm.setDurationMinutes}
        onChangeTime={eventForm.setEventTime}
        onChangeTitle={eventForm.setTitle}
        onCreate={eventForm.createEvent}
        onSelectCalendar={setSelectedCalendarId}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <CalendarEventList
        emptyMessage={emptyMessage}
        events={events}
        isLoading={isRequesting || isDataLoading}
        isRefreshing={isRefreshing}
        hasPermission={hasPermission}
        onRefresh={refreshEvents}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    flex: 1,
    paddingHorizontal: 20,
  },
  error: {
    color: '#b91c1c',
    fontSize: 14,
    marginBottom: 12,
  },
});

export default App;
