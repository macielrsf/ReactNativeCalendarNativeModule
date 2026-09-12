import React from 'react';
import {Button, StyleSheet, TextInput, View} from 'react-native';
import {CalendarAccount} from '../modules';
import {CalendarPicker} from './CalendarPicker';

interface CalendarEventFormProps {
  calendars: CalendarAccount[];
  durationMinutes: string;
  eventDate: string;
  eventTime: string;
  hasPermission: boolean;
  isCreating: boolean;
  selectedCalendarId: string | null;
  title: string;
  onChangeDate: (value: string) => void;
  onChangeDuration: (value: string) => void;
  onChangeTime: (value: string) => void;
  onChangeTitle: (value: string) => void;
  onCreate: () => void;
  onSelectCalendar: (calendarId: string) => void;
}

export const CalendarEventForm = ({
  calendars,
  durationMinutes,
  eventDate,
  eventTime,
  hasPermission,
  isCreating,
  selectedCalendarId,
  title,
  onChangeDate,
  onChangeDuration,
  onChangeTime,
  onChangeTitle,
  onCreate,
  onSelectCalendar,
}: CalendarEventFormProps) => {
  const disabled = !hasPermission || isCreating;

  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={onChangeTitle}
        placeholder="Event title"
        placeholderTextColor="#6b7280"
        editable={!disabled}
      />
      <View style={styles.formRow}>
        <TextInput
          style={[styles.input, styles.dateInput]}
          value={eventDate}
          onChangeText={onChangeDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#6b7280"
          editable={!disabled}
          keyboardType="numbers-and-punctuation"
        />
        <TextInput
          style={[styles.input, styles.timeInput]}
          value={eventTime}
          onChangeText={onChangeTime}
          placeholder="HH:mm"
          placeholderTextColor="#6b7280"
          editable={!disabled}
          keyboardType="numbers-and-punctuation"
        />
        <TextInput
          style={[styles.input, styles.durationInput]}
          value={durationMinutes}
          onChangeText={onChangeDuration}
          placeholder="Minutes"
          placeholderTextColor="#6b7280"
          editable={!disabled}
          keyboardType="number-pad"
        />
      </View>
      <CalendarPicker
        calendars={calendars}
        disabled={disabled}
        selectedCalendarId={selectedCalendarId}
        onSelect={onSelectCalendar}
      />
      <Button
        title={isCreating ? 'Creating...' : 'Add event'}
        onPress={onCreate}
        disabled={disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
});
