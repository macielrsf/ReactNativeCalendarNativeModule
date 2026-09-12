import { Button, StyleSheet, View } from 'react-native';
import {CalendarModule} from '../../modules';

export const CalendarButton = () => {
  const onPress = () => {
    const startDate = Date.now() + 60 * 60 * 1000;
    const endDate = startDate + 60 * 60 * 1000;
    void CalendarModule.addEvent('New Event', startDate, endDate);
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
