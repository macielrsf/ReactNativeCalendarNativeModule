import {useCallback, useEffect, useState} from 'react';
import {
  addCalendarChangedListener,
  CalendarAccount,
  CalendarEvent,
  CalendarModule,
} from '../modules';

export const useCalendarData = (hasPermission: boolean) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarAccount[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      setEvents(await CalendarModule.getEvents());
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Unable to load calendar events.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchCalendars = useCallback(async () => {
    try {
      setError(null);
      const nextCalendars = await CalendarModule.getCalendars();
      setCalendars(nextCalendars);
      setSelectedCalendarId(currentCalendarId => {
        if (
          currentCalendarId &&
          nextCalendars.some(calendar => calendar.id === currentCalendarId)
        ) {
          return currentCalendarId;
        }

        return (
          nextCalendars.find(
            calendar =>
              calendar.isWritable &&
              calendar.isGoogle &&
              calendar.isPrimary,
          )?.id ??
          nextCalendars.find(
            calendar => calendar.isWritable && calendar.isGoogle,
          )?.id ??
          nextCalendars.find(
            calendar => calendar.isWritable && calendar.isVisible,
          )?.id ??
          nextCalendars.find(calendar => calendar.isWritable)?.id ??
          null
        );
      });
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Unable to load calendars.',
      );
    }
  }, []);

  const reload = useCallback(() => {
    if (!hasPermission) {
      return;
    }

    Promise.all([fetchCalendars(), fetchEvents()]);
  }, [fetchCalendars, fetchEvents, hasPermission]);

  const refreshEvents = useCallback(() => {
    if (!hasPermission) {
      return;
    }

    setIsRefreshing(true);
    fetchEvents();
  }, [fetchEvents, hasPermission]);

  useEffect(() => {
    if (!hasPermission) {
      setIsLoading(false);
      return;
    }

    reload();
  }, [hasPermission, reload]);

  useEffect(() => {
    if (!hasPermission) {
      return;
    }

    const subscription = addCalendarChangedListener(reload);
    return () => subscription.remove();
  }, [hasPermission, reload]);

  return {
    calendars,
    error,
    events,
    fetchCalendars,
    fetchEvents,
    isLoading,
    isRefreshing,
    refreshEvents,
    reload,
    selectedCalendarId,
    setSelectedCalendarId,
  };
};
