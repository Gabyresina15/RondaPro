# RondaPro Mobile

Flutter (Material 3) client for RondaPro vertical slice #2: login, templates, rondas, photos, LLM summary, historial.

## Requirements

- Flutter SDK >= 3.5
- Running API at the configured base URL

## Configure API URL

Default: `http://127.0.0.1:3000`

```bash
# Android emulator → host machine
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000

# iOS simulator / desktop
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:3000

# Physical device (LAN IP of your machine)
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:3000
```

## Run

```bash
cd apps/mobile
flutter pub get
flutter run
```

Demo credentials (after API seed): `demo@rondapro.local` / `Demo1234!`

Flow: login → Templates tab → tap a template → fill answers → add ≥2 photos (gallery or “Add 2 demo photos”) → Complete ronda → summary → Historial tab.

## Platform scaffolding

If `flutter create` was never run on your machine:

```bash
cd apps/mobile
flutter create . --project-name rondapro --org com.rondapro
```
