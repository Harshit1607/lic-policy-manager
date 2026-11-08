# LIC Policy Manager

Offline-first React Native (Expo) Android app for LIC agents to manage clients, policies, premiums and due reminders.

Everything is stored on the phone in a local SQLite database. There are no accounts, no cloud services and nothing paid.

## Features

- **Clients (policyholders):** name, phone, address, date of birth, nominee name and relation, notes. Each client page lists all of that client's policies.
- **Policies:** policy number, plan name and plan number, sum assured, commencement date, policy term, premium paying term, maturity date (derived), premium amount and mode (monthly, quarterly, half-yearly, yearly), and agent commission rate.
- **Premium status, derived automatically** from the commencement date, mode and recorded payments:
  - next due date
  - grace period end (LIC rule: 15 days for monthly, 30 days for every other mode)
  - number of overdue instalments and overdue amount
  - status: Active, Due soon, Overdue (in grace), Lapsed (grace elapsed), Fully paid, Matured
- **Payment history** per policy with receipt number, paid date, late fee and notes.
- **Due reminders dashboard:** overdue, due this week and due this month, with one-tap Call or WhatsApp to the client (WhatsApp opens with a pre-filled premium reminder message).
- **Local notifications** a few days before each premium due date and on the day itself (scheduled on the device, no server).
- **Search** clients by name or phone, and policies by policy number, client name or plan.
- **Commission tracking:** commission earned per policy and in total, based on each policy's commission rate and its recorded payments.
- **Export and backup:** CSV export of all policies (opens in Excel or Google Sheets), full JSON backup through the Android share sheet, and JSON restore.

## Design

A strict monochrome look (black, white and greys only): solid black header blocks with blob and wavy line-art shapes, outlined cards, a pill search field, filled-black primary and outlined secondary buttons, and original line illustrations for the welcome and empty screens. Policy status is shown by badge weight and icon rather than colour: lapsed is a filled black badge, overdue a heavy outline, due soon a regular outline, and settled states a soft grey. The dashboard's progress ring shows how many of this month's premium instalments are already collected. All colours live in `src/theme.ts`.

## Project layout

```
App.tsx                 app entry: DB init, navigation container
src/domain/             pure logic (dates, premium schedule, status, formatting) + unit tests
src/db/                 expo-sqlite schema and CRUD for clients, policies, payments
src/services/           aggregation, CSV/JSON export & restore, notifications, call/WhatsApp
src/screens/            UI screens
src/navigation/         bottom tabs + stack navigator
```

## Development

Requirements: Node.js 20+ and npm.

```bash
npm install
npm test            # unit tests (premium/due-date logic, CSV/JSON, aggregation)
npm run typecheck   # TypeScript
npx expo start      # run in Expo Go or a dev build
```

## Building the release APK (free, local)

The APK is built locally with Gradle; no EAS account or paid service is needed. The APK is not committed to the repository.

Requirements:

- JDK 17
- Android SDK with: `platforms;android-36`, `platforms;android-37.0`, `build-tools;37.0.0`, `ndk;27.1.12297006`, `cmake;3.22.1`, `platform-tools` (install with `sdkmanager`)
- `ANDROID_HOME` pointing at the SDK (or an `android/local.properties` with `sdk.dir=...`)

Steps:

```bash
npm install
npx expo prebuild --platform android --clean   # generates the android/ folder (git-ignored)
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
```

The APK is written to:

```
android/app/build/outputs/apk/release/app-release.apk
```

Copy it to the phone and install it (allow "Install unknown apps" for your file manager or browser). Drop `-PreactNativeArchitectures=...` to also include x86/x86_64 for emulators.

### Signing

By default the generated project signs the release build with the Android debug keystore, which is fine for sideloading onto your own phone. To sign with your own key, create one with
`keytool -genkeypair -v -keystore my-release.jks -alias lic -keyalg RSA -keysize 2048 -validity 10000`
and add a `release` signing config in `android/app/build.gradle` as described in the [React Native signing guide](https://reactnative.dev/docs/signed-apk-android). Keep the keystore out of git (`*.jks` is ignored). Use the same key for every update, otherwise Android will refuse to install the new APK over the old one.

## Backups

Data lives only on the phone, so export a JSON backup regularly from **Settings → Backup all data (JSON)** and save it somewhere safe (Drive, email, etc.). **Settings → Restore from JSON backup** replaces all current data with the backup's contents.
