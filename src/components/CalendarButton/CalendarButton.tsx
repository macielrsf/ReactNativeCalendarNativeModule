import { Button, StyleSheet, View } from 'react-native';
import {CalendarModule} from '../../modules';

export const CalendarButton = () => {
  const onPress = () => {
    CalendarModule.createCalendarEvent('New Event', 'My Calendar');
  };

  return (
    <View style={styles.button}>
      <Button
        title="Click to invoke your native module!"
        color="#841584"
        onPress={onPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    marginTop: 20,
  },
});
