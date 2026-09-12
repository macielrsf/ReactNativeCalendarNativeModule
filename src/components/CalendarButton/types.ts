export interface ICalendarModule {
    createCalendarEvent(title: string, location: string): void;
}

declare module 'react-native' {
  interface NativeModulesStatic {
    CalendarModule: ICalendarModule;
  }
}