import {useCallback, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';

export const useCalendarPermissions = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRequesting, setIsRequesting] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const requestCalendarPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setHasPermission(false);
      setIsRequesting(false);
      setPermissionError('CalendarModule is implemented for Android in this sample.');
      return false;
    }

    try {
      setIsRequesting(true);
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
        PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR,
      ]);
      const granted =
        result[PermissionsAndroid.PERMISSIONS.READ_CALENDAR] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        result[PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR] ===
          PermissionsAndroid.RESULTS.GRANTED;

      setHasPermission(granted);
      setPermissionError(granted ? null : 'Calendar permission was denied.');
      return granted;
    } catch (exception) {
      setHasPermission(false);
      setPermissionError(
        exception instanceof Error
          ? exception.message
          : 'Unable to request calendar permission.',
      );
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  return {
    hasPermission,
    isRequesting,
    permissionError,
    requestCalendarPermissions,
  };
};
