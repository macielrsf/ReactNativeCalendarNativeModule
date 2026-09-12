import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {CalendarModule} from '../modules';

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

interface UseCalendarEventFormOptions {
  onCreated: () => Promise<void> | void;
  selectedCalendarId: string | null;
}

export const useCalendarEventForm = ({
  onCreated,
  selectedCalendarId,
}: UseCalendarEventFormOptions) => {
  const [title, setTitle] = useState('React Native calendar event');
  const [eventDate, setEventDate] = useState(getDefaultDateInput);
  const [eventTime, setEventTime] = useState(getDefaultTimeInput);
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await onCreated();
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
  }, [durationMinutes, eventDate, eventTime, onCreated, selectedCalendarId, title]);

  return {
    createEvent,
    durationMinutes,
    error,
    eventDate,
    eventTime,
    isCreating,
    setDurationMinutes,
    setEventDate,
    setEventTime,
    setTitle,
    title,
  };
};
