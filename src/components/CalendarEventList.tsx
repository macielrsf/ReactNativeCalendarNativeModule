import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {CalendarEvent} from '../modules';
import {CalendarEventItem} from './CalendarEventItem';

interface CalendarEventListProps {
  emptyMessage: string;
  events: CalendarEvent[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasPermission: boolean;
  onRefresh: () => void;
}

export const CalendarEventList = ({
  emptyMessage,
  events,
  isLoading,
  isRefreshing,
  hasPermission,
  onRefresh,
}: CalendarEventListProps) => {
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={item => item.id}
      renderItem={({item}) => <CalendarEventItem event={item} />}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          enabled={hasPermission}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  empty: {
    color: '#4b5563',
    fontSize: 15,
    paddingTop: 32,
    textAlign: 'center',
  },
});
