# DrinkReminder

**Drink more — live better!**

Water-tracking app for Google Play: Expo (React Native + TypeScript) frontend with a fully
offline-first core loop, plus an optional FastAPI backup backend keyed by an anonymous device
UUID. No accounts, no login.

```
DrinkReminder/
├── mobile/    Expo SDK 54 app (TypeScript, expo-sqlite, reanimated, expo-notifications)
└── backend/   FastAPI + SQLAlchemy + SQLite backup service
```

## Mobile app

### Run in development

```powershell
cd mobile
npm install
npx expo run:android     # dev build on an emulator/device
# or: npx expo start     # Metro only (Expo Go does not include all native modules; prefer run:android)
```

### Architecture notes

- **Local SQLite is the source of truth** (`src/db/`). Every tap writes to `expo-sqlite`
  synchronously; UI updates immediately; the app is 100% usable offline.
- **Sync** (`src/api/sync.ts`) pushes unsynced rows / queued deletions / dirty settings to the
  backend in the background (app start, foreground, debounced after each mutation). Failures are
  silent; nothing in the UI depends on the network.
- **Device identity**: a UUID generated once with `expo-crypto` and stored in the local `meta`
  table, sent as the `X-Device-Id` header.
- **Reminders** are local daily notifications via `expo-notifications`. Permission is requested
  only when the user flips the master switch; if denied, the tab shows a "permission needed"
  card with a shortcut to system settings and the rest of the app keeps working.
- **Animations** (react-native-reanimated): progress-ring arc timing animation, button press
  scale, list row enter/exit + layout transitions. No wave/floating effects by design, and no
  animation ever blocks a data write.

### Backend URL

The app reads the backend URL from (in priority order):

1. `EXPO_PUBLIC_API_URL` environment variable at build time
2. `extra.apiUrl` in `mobile/app.json` (default `http://10.0.2.2:8000` — host machine as seen
   from the Android emulator)

Point it at your deployed backend for production builds. If unset/unreachable, the app simply
runs offline.

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000
```

- Interactive docs at `http://localhost:8000/docs`.
- SQLite file `drinkreminder.db` is created next to `main.py`; override with the
  `DRINKREMINDER_DATABASE_URL` env var.
- Deployable anywhere that runs Python (VPS + uvicorn/gunicorn behind nginx, Fly.io, Railway…).
  CORS is open; the only identifier is the anonymous device UUID.

Smoke test (uses a throwaway DB):

```powershell
.\.venv\Scripts\pip install -r requirements-dev.txt
.\.venv\Scripts\python smoke_test.py
```

### Endpoints

| Method | Path                | Description                                   |
| ------ | ------------------- | --------------------------------------------- |
| POST   | `/devices/register` | Idempotent device registration                |
| GET    | `/entries?from=&to=`| Entries for the device, optional date range   |
| POST   | `/entries`          | Create an intake entry                        |
| DELETE | `/entries/{id}`     | Delete an entry (scoped to the device)        |
| GET    | `/settings`         | Get settings (defaults created on first call) |
| PUT    | `/settings`         | Upsert settings                               |

Device id goes in the `X-Device-Id` header (or `device_id` query param).

## Building a release AAB (local signing, no EAS)

The native Android project is already generated in `mobile/android/` (re-create any time with
`npx expo prebuild -p android`).

1. **Create a keystore** (once, keep it safe — losing it means losing the Play listing):

   ```powershell
   keytool -genkeypair -v -keystore release.keystore -alias drinkreminder `
     -keyalg RSA -keysize 2048 -validity 10000
   ```

   Put `release.keystore` in `mobile/android/app/`.

2. **Add credentials** to `mobile/android/gradle.properties`:

   ```properties
   DRINKREMINDER_UPLOAD_STORE_FILE=release.keystore
   DRINKREMINDER_UPLOAD_KEY_ALIAS=drinkreminder
   DRINKREMINDER_UPLOAD_STORE_PASSWORD=your-store-password
   DRINKREMINDER_UPLOAD_KEY_PASSWORD=your-key-password
   ```

3. **Wire the signing config** in `mobile/android/app/build.gradle`: inside
   `android { signingConfigs { ... } }` add

   ```groovy
   release {
       if (project.hasProperty('DRINKREMINDER_UPLOAD_STORE_FILE')) {
           storeFile file(DRINKREMINDER_UPLOAD_STORE_FILE)
           storePassword DRINKREMINDER_UPLOAD_STORE_PASSWORD
           keyAlias DRINKREMINDER_UPLOAD_KEY_ALIAS
           keyPassword DRINKREMINDER_UPLOAD_KEY_PASSWORD
       }
   }
   ```

   and in `buildTypes { release { ... } }` change `signingConfig signingConfigs.debug` to
   `signingConfig signingConfigs.release`.

4. **Build**:

   ```powershell
   cd mobile\android
   .\gradlew bundleRelease
   ```

   Output: `mobile/android/app/build/outputs/bundle/release/app-release.aab`.
   Alternatively open `mobile/android/` in Android Studio and use
   **Build → Generate Signed App Bundle**.

Note for Play submission: the app itself intentionally contains no privacy-policy screen; the
Play Console form will still ask for an externally hosted privacy-policy URL when you list a
Health & Fitness app.
