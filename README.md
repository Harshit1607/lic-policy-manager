# LIC Policy Manager

Offline-first React Native (Expo) Android app for LIC agents to manage clients, policies, premiums and due reminders.

Everything is stored on the phone in a local SQLite database. There are no accounts, no cloud services and nothing paid.

## Features

- **Clients (policyholders):** name, phone, address, date of birth, nominee name and relation, notes. Each client page lists all of that client's policies.
- **Policies:** policy number, plan name and plan number, sum assured, commencement date, policy term, premium paying term, maturity date (derived), premium amount and mode (monthly, quarterly, half-yearly, yearly), agent commission rate, and an optional "premiums paid up to" date so an existing policy can be entered without re-recording its past payments.
- **Premium status, derived automatically** from the commencement date, mode, the "premiums paid up to" date and recorded payments:
  - next due date
  - grace period end (LIC rule: 15 days for monthly, 30 days for every other mode)
  - number of overdue instalments and overdue amount
  - status: Active, Due soon, Overdue (in grace), Lapsed (grace elapsed), Fully paid, Matured
- **Payment history** per policy with receipt number, paid date, late fee and notes.
- **Due reminders dashboard:** overdue, due this week and due this month, with one-tap Call or WhatsApp to the client (WhatsApp opens with a pre-filled premium reminder message).
- **Local notifications** a few days before each premium due within the next 45 days and on the day itself (soonest 100 policies; scheduled on the device, no server, and refreshed each time the dashboard opens).
- **Meetings:** plan a meeting with a client (optionally linked to one of their policies) or with a prospect who is not a client yet (typed name and phone). Each meeting has a date and time, place, purpose (new policy pitch, premium collection, claim/maturity paperwork, other), notes and a reminder (at the time, 15 minutes, 1 hour or 1 day before; default 1 hour). The reminder is a local notification that is rescheduled on edit and cancelled when the meeting is deleted or marked done; tapping it opens the meeting. Upcoming meetings for today and the next three days show on Home, the full list (upcoming, past not marked done, and done) opens from the calendar icon in the top bar, and each client page lists that client's meetings with an "Add meeting" action. Meetings can be marked done with an optional outcome note, and the client can be called or messaged on WhatsApp from the meeting.
- **Search** clients by name or phone, and policies by policy number, client name or plan.
- **Commission tracking:** commission earned per policy and in total, based on each policy's commission rate and its recorded payments.
- **Export and backup:** CSV export of all policies and of all meetings (opens in Excel or Google Sheets), full JSON backup (clients, policies, payments and meetings) through the Android share sheet, and JSON restore. Older backups without meetings still restore.

## Design

A strict monochrome look (black, white and greys only): solid black header blocks with blob and wavy line-art shapes, outlined cards, a pill search field, filled-black primary and outlined secondary buttons, and original line illustrations for the welcome and empty screens. Policy status is shown by badge weight and icon rather than colour: lapsed is a filled black badge, overdue a heavy outline, due soon a regular outline, and settled states a soft grey. The dashboard's progress ring shows how many of this month's premium instalments are already collected. All colours live in `src/theme.ts`.

## Project layout

```
App.tsx                 app entry: DB init, navigation container
src/domain/             pure logic (dates, premium schedule, status, meetings, formatting) + unit tests
src/db/                 expo-sqlite schema and CRUD for clients, policies, payments, meetings
src/services/           aggregation, CSV/JSON export & restore, notifications, call/WhatsApp
src/screens/            UI screens
src/navigation/         bottom tabs + stack navigator
```

## Development

Requirements: Node.js 20+ and npm.

```bash
npm install
npm test            # unit tests (premium/due-date and meeting logic, CSV/JSON, aggregation)
npm run typecheck   # TypeScript
npx expo start      # run in Expo Go or a dev build
```

## Building the release APK (free, local)

The APK is built locally with Gradle; no EAS account or paid service is needed. The APK is not committed to the repository.

Requirements:

- JDK 17
- Android SDK with: `platforms;android-36`, `platforms;android-37.0`, `build-tools;37.0.0`, `ndk;27.1.12297006`, `cmake;3.22.1`, `platform-tools` (install with `sdkmanager`)
- `ANDROID_HOME` pointing at the SDK (or an `android/local.properties` with `sdk.dir=...`)

- The app's permanent release keystore and its four `LIC_*` values (see [Signing](#signing))

Steps:

```bash
npm install
export LIC_KEYSTORE=/secure/path/release.keystore
export LIC_KEYSTORE_PASSWORD='...'
export LIC_KEY_ALIAS='...'
export LIC_KEY_PASSWORD='...'
npm run build:apk
```

`npm run build:apk` regenerates the `android/` folder (`expo prebuild --platform android --clean`, git-ignored) and runs `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a`. The APK is written to:

```
android/app/build/outputs/apk/release/app-release.apk
```

Copy it to the phone and install it (allow "Install unknown apps" for your file manager or browser). To also include x86/x86_64 for emulators, run the prebuild and then `./gradlew assembleRelease` in `android/` without `-PreactNativeArchitectures`.

### Signing

Release builds are signed with the app's permanent release key. The config plugin `plugins/withReleaseSigning.js` (listed in `app.json`) adds this to the generated `android/app/build.gradle` on every prebuild, reading the key from four environment variables:

| Variable | Value |
| --- | --- |
| `LIC_KEYSTORE` | absolute path to the release keystore file |
| `LIC_KEYSTORE_PASSWORD` | keystore password |
| `LIC_KEY_ALIAS` | alias of the key inside the keystore |
| `LIC_KEY_PASSWORD` | key password (the same as the keystore password for a PKCS12 keystore) |

If any of them is missing, or the keystore file does not exist, the release build stops with an error. It never falls back to the debug key. Debug builds (`npx expo run:android`) are not affected.

The keystore and passwords are never committed: keep the keystore outside the repository (`.gitignore` also ignores `*.jks` and `*.keystore`). Keep the keystore file and its passwords together somewhere safe and backed up, for example a password manager plus an offline copy.

**Do not lose the keystore or its passwords.** Android only installs an update over an existing app when it is signed with the same key. Without this key, a new APK can no longer be installed over the app; the agent would have to uninstall it first, which deletes all data stored on the phone (export a JSON backup before doing that).

To create a key for a fork of this app (only once, then reuse it for every release):

```bash
keytool -genkeypair -v -keystore release.keystore -storetype PKCS12 -alias lic-release \
  -keyalg RSA -keysize 4096 -validity 12000
```

To check which key signed an APK:

```bash
$ANDROID_HOME/build-tools/<version>/apksigner verify --print-certs app-release.apk
```

## Backups

Data lives only on the phone, so export a JSON backup regularly from **Settings → Backup all data (JSON)** and save it somewhere safe (Drive, email, etc.). **Settings → Restore from JSON backup** replaces all current data with the backup's contents.
