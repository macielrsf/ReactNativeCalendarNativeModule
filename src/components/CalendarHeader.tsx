import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

export const CalendarHeader = () => (
  <View style={styles.header}>
    <Text style={styles.heading}>Calendar Events</Text>
    <Text style={styles.subheading}>Current month from Android Calendar</Text>
  </View>
);

const styles = StyleSheet.create({
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
});
