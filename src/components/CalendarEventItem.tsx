import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {CalendarEvent} from '../modules';

const formatDateTime = (value: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

interface CalendarEventItemProps {
  event: CalendarEvent;
}

export const CalendarEventItem = ({event}: CalendarEventItemProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>{event.title || 'Untitled event'}</Text>
    <Text style={styles.time}>
      {formatDateTime(event.startDate)} - {formatDateTime(event.endDate)}
    </Text>
    {!!event.description && (
      <Text style={styles.description}>{event.description}</Text>
    )}
    {!!event.calendarName && (
      <Text style={styles.calendar}>
        {event.calendarName}
        {event.accountName ? ` - ${event.accountName}` : ''}
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  title: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    color: '#2563eb',
    fontSize: 13,
    marginTop: 6,
  },
  description: {
    color: '#4b5563',
    fontSize: 14,
    marginTop: 8,
  },
  calendar: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
  },
});
