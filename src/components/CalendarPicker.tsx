import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {CalendarAccount} from '../modules';

interface CalendarPickerProps {
  calendars: CalendarAccount[];
  disabled: boolean;
  selectedCalendarId: string | null;
  onSelect: (calendarId: string) => void;
}

export const CalendarPicker = ({
  calendars,
  disabled,
  selectedCalendarId,
  onSelect,
}: CalendarPickerProps) => (
  <View style={styles.container}>
    {calendars
      .filter(calendar => calendar.isWritable)
      .map(calendar => {
        const isSelected = calendar.id === selectedCalendarId;
        return (
          <Pressable
            key={calendar.id}
            style={[styles.choice, isSelected && styles.selectedChoice]}
            onPress={() => onSelect(calendar.id)}
            disabled={disabled}>
            <Text
              style={[styles.name, isSelected && styles.selectedText]}
              numberOfLines={1}>
              {calendar.name || calendar.accountName || 'Calendar'}
            </Text>
            <Text
              style={[styles.account, isSelected && styles.selectedText]}
              numberOfLines={1}>
              {calendar.isGoogle ? 'Google' : calendar.accountType} -{' '}
              {calendar.accountName}
            </Text>
          </Pressable>
        );
      })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
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
  selectedChoice: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  name: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },
  account: {
    color: '#4b5563',
    fontSize: 12,
    marginTop: 3,
  },
  selectedText: {
    color: '#ffffff',
  },
});
