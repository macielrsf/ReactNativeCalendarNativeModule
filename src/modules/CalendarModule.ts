import {EmitterSubscription, NativeEventEmitter, NativeModules} from 'react-native';
import {useEffect} from 'react';

export interface CalendarEvent {
  id: string;
  eventId?: string;
  title: string;
  description: string;
  startDate: number;
  endDate: number;
  calendarId?: string;
  calendarName?: string;
  accountName?: string;
  accountType?: string;
}

export interface CalendarAccount {
  id: string;
  name: string;
  accountName: string;
  accountType: string;
  ownerAccount: string;
  isGoogle: boolean;
  isVisible: boolean;
  isPrimary: boolean;
  isWritable: boolean;
  accessLevel: number;
}

interface CalendarModuleInterface {
  getEvents(): Promise<CalendarEvent[]>;
  getCalendars(): Promise<CalendarAccount[]>;
  addEvent(title: string, startDate: number, endDate: number): Promise<string>;
  addEventToCalendar(
    title: string,
    startDate: number,
    endDate: number,
    calendarId: string,
  ): Promise<string>;
  startObserving(): void;
  stopObserving(): void;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export interface CalendarChangedEvent {
  uri?: string;
}

const nativeCalendarModule = NativeModules.CalendarModule as CalendarModuleInterface;
let calendarEventEmitter: NativeEventEmitter | null = null;

const getCalendarEventEmitter = () => {
  if (!nativeCalendarModule) {
    throw new Error('CalendarModule native module is not available.');
  }

  if (!calendarEventEmitter) {
    calendarEventEmitter = new NativeEventEmitter(nativeCalendarModule);
  }

  return calendarEventEmitter;
};

export const CalendarModule = nativeCalendarModule;

export const addCalendarChangedListener = (
  listener: (event: CalendarChangedEvent) => void,
): EmitterSubscription =>
  getCalendarEventEmitter().addListener('onCalendarChanged', listener);

export const useCalendarChanged = (
  listener: (event: CalendarChangedEvent) => void,
) => {
  useEffect(() => {
    const subscription = addCalendarChangedListener(listener);
    return () => subscription.remove();
  }, [listener]);
};
