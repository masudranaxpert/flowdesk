# Android App

FlowDesk ships an Android shell via [Capacitor](https://capacitorjs.com).

## How releases work

APK builds are fully automated with GitHub Actions:

1. Push a tag: `git tag v1.2.0 && git push origin v1.2.0`
2. The [`android-release.yml`](https://github.com/masudranaxpert/flowdesk/blob/main/.github/workflows/android-release.yml)
   workflow builds a debug APK on JDK 21.
3. The APK is attached to a GitHub Release automatically.

## Local build (Windows)

Requirements: Node 22+, JDK 21, Android SDK.

```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Notes

- The native app talks to `https://masud-rana.me/api` — see `src/lib/api.ts`.
- Local notifications (Routine reminders) use the
  `@capacitor/local-notifications` plugin with `USE_EXACT_ALARM`.
- Push notifications use `@capacitor-firebase/messaging`.
