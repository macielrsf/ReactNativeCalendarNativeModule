# ReactNativeCalendarNativeModule

Native calendar integration for React Native on Android, implemented in Kotlin with `CalendarContract` and `ContentResolver`.

The app can read calendar events, create events with a date and time, list available calendars, and notify JavaScript when the device calendar changes.

## English

### Features

- Read events from the current month through Android's Calendar Provider.
- Create events with a title, date, start time, and duration.
- Select a writable calendar before creating an event.
- Prefer a writable Google calendar when one is available.
- Receive real-time `onCalendarChanged` events from a native `ContentObserver`.
- Refresh the React Native event list after changes made by another calendar app.
- Support recurring event instances returned by `CalendarContract.Instances`.

### Requirements

- Node.js `>= 22.11.0`
- React Native `0.87.1`
- Android Studio and Android SDK
- An Android device or emulator with a calendar provider
- A Google account added to the device for Google Calendar synchronization

### Installation

Install JavaScript dependencies:

```sh
npm install
```

Start Metro:

```sh
npm start
```

In another terminal, install and run the Android app:

```sh
npm run android
```

The application requests these permissions at runtime:

- `android.permission.READ_CALENDAR`
- `android.permission.WRITE_CALENDAR`

The permissions are also declared in `android/app/src/main/AndroidManifest.xml`.

### Google Calendar synchronization

The module does not connect directly to the Google Calendar API. It uses Android's local Calendar Provider. For an event to appear in Google Calendar, the selected calendar must be a writable, synchronized Google calendar exposed by the device.

If only `LOCAL - react-native-calendar-native-module` is listed:

1. Add the Google account in Android Settings.
2. Enable Calendar synchronization for that account.
3. Confirm that the target calendar is visible and writable in Google Calendar.
4. Open Google Calendar and force a refresh.
5. Reopen or refresh this application.

Android controls when data is synchronized with Google's servers. The module cannot force an immediate cloud synchronization. Events created in a local calendar remain local and will not appear in Google Calendar.

### Native module API

The JavaScript bridge is available from `src/modules/CalendarModule.ts`:

```ts
import {
  addCalendarChangedListener,
  CalendarModule,
} from './src/modules';

const calendars = await CalendarModule.getCalendars();
const events = await CalendarModule.getEvents();

const eventId = await CalendarModule.addEventToCalendar(
  'Project meeting',
  startDateInEpochMilliseconds,
  endDateInEpochMilliseconds,
  googleCalendarId,
);

const subscription = addCalendarChangedListener(() => {
  // Reload events and calendars here.
});

subscription.remove();
```

Available native methods:

- `getEvents()` returns event instances for the current month.
- `getCalendars()` returns calendar names, account information, visibility, and write access.
- `addEvent(title, startDate, endDate)` creates an event in the preferred writable calendar.
- `addEventToCalendar(title, startDate, endDate, calendarId)` creates an event in a specific calendar.
- `startObserving()` and `stopObserving()` manage the native calendar observer.

Dates use Unix epoch milliseconds, for example `Date.now()` or `new Date().getTime()`.

### Project structure

```text
android/app/src/main/java/com/reactnativecalendarnativemodule/
  CalendarModule.kt       Native CalendarContract module
  CalendarPackage.kt      React Native package registration
  MainApplication.kt      Package registration in the Android app

src/modules/
  CalendarModule.ts       TypeScript bridge and event listener helpers

App.tsx                   Example calendar UI
```

### Validation

```sh
npx tsc --noEmit
npm test -- --runInBand
```

## Capturas de tela / Screenshots

Add application screenshots to this section. Suggested files:

```text
docs/screenshots/calendar-events.png
docs/screenshots/google-calendar-sync.png
```

Example:

```md
![Calendar events list](docs/screenshots/calendar-events.png)
![Google Calendar synchronization](docs/screenshots/google-calendar-sync.png)
```

---

## Português (Brasil)

### Sobre o projeto

Integração nativa de calendário para React Native no Android, implementada em Kotlin com `CalendarContract` e `ContentResolver`.

O aplicativo pode ler eventos do calendário, criar eventos com data e horário, listar calendários disponíveis e avisar o JavaScript quando o calendário do dispositivo for alterado.

### Funcionalidades

- Ler os eventos do mês atual pelo Android Calendar Provider.
- Criar eventos informando título, data, horário inicial e duração.
- Selecionar um calendário com permissão de escrita antes de criar o evento.
- Priorizar um calendário Google gravável quando ele estiver disponível.
- Receber o evento nativo `onCalendarChanged` por meio de um `ContentObserver`.
- Atualizar a lista do React Native após alterações feitas por outro aplicativo de calendário.
- Suportar ocorrências de eventos recorrentes retornadas por `CalendarContract.Instances`.

### Requisitos

- Node.js `>= 22.11.0`
- React Native `0.87.1`
- Android Studio e Android SDK
- Um dispositivo ou emulador Android com um provedor de calendário
- Uma conta Google adicionada ao dispositivo para sincronização com o Google Calendar

### Instalação e execução

Instale as dependências JavaScript:

```sh
npm install
```

Inicie o Metro:

```sh
npm start
```

Em outro terminal, instale e execute o aplicativo Android:

```sh
npm run android
```

O aplicativo solicita estas permissões durante a execução:

- `android.permission.READ_CALENDAR`
- `android.permission.WRITE_CALENDAR`

As permissões também estão declaradas em `android/app/src/main/AndroidManifest.xml`.

### Sincronização com o Google Calendar

O módulo não se conecta diretamente à API do Google Calendar. Ele usa o Calendar Provider local do Android. Para que um evento apareça no Google Calendar, o calendário selecionado precisa ser um calendário Google gravável e sincronizado, disponibilizado pelo dispositivo.

Se apenas `LOCAL - react-native-calendar-native-module` aparecer:

1. Adicione a conta Google nas configurações do Android.
2. Ative a sincronização do Calendar para essa conta.
3. Confirme que o calendário desejado está visível e permite escrita no Google Calendar.
4. Abra o Google Calendar e atualize os dados.
5. Reabra ou atualize este aplicativo.

O Android controla quando os dados são sincronizados com os servidores do Google. O módulo não consegue forçar uma sincronização imediata com a nuvem. Eventos criados em um calendário local permanecem locais e não aparecerão no Google Calendar.

### API do módulo nativo

A ponte JavaScript está disponível em `src/modules/CalendarModule.ts`:

```ts
import {
  addCalendarChangedListener,
  CalendarModule,
} from './src/modules';

const calendars = await CalendarModule.getCalendars();
const events = await CalendarModule.getEvents();

const eventId = await CalendarModule.addEventToCalendar(
  'Reunião do projeto',
  startDateInEpochMilliseconds,
  endDateInEpochMilliseconds,
  googleCalendarId,
);

const subscription = addCalendarChangedListener(() => {
  // Recarregue os eventos e calendários aqui.
});

subscription.remove();
```

Métodos nativos disponíveis:

- `getEvents()` retorna as ocorrências do mês atual.
- `getCalendars()` retorna nome, conta, visibilidade e permissão de escrita dos calendários.
- `addEvent(title, startDate, endDate)` cria um evento no calendário gravável preferido.
- `addEventToCalendar(title, startDate, endDate, calendarId)` cria um evento em um calendário específico.
- `startObserving()` e `stopObserving()` controlam o observador nativo do calendário.

As datas usam milissegundos desde o Unix epoch, por exemplo `Date.now()` ou `new Date().getTime()`.

### Estrutura do projeto

```text
android/app/src/main/java/com/reactnativecalendarnativemodule/
  CalendarModule.kt       Módulo nativo baseado em CalendarContract
  CalendarPackage.kt      Registro do pacote React Native
  MainApplication.kt      Registro do pacote no aplicativo Android

src/modules/
  CalendarModule.ts       Ponte TypeScript e helpers de eventos

App.tsx                   Interface de exemplo do calendário
```

### Validação

```sh
npx tsc --noEmit
npm test -- --runInBand
```

### Solução de problemas

Se os eventos criados no Google Calendar não aparecerem:

- confirme que o app recebeu `READ_CALENDAR`;
- confirme que a sincronização do Google Calendar está ativa;
- verifique se a conta e o calendário correto estão selecionados;
- atualize o Google Calendar e depois use o gesto de atualizar neste app;
- verifique se o calendário não é apenas local ou somente leitura.
