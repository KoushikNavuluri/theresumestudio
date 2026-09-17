# ResumeStudio Android test build

Branch: feat/gemini-rstudio. App: ResumeStudio Test.
Package ID: com.koushiknavuluri.resumestudio.test.

## Finish setup

The Android config and dedicated Vite config are committed. The GitHub connection cannot write workflows, so upload the supplied `android-debug.yml` as `.github/workflows/android-debug.yml` on THIS branch, not main or the repository's default branch. Its push trigger starts the build when that file is committed, assuming Actions is enabled.

Open Actions > Android test APK, wait for a successful run, and download the ResumeStudio-test-apk artifact. Unzip it, transfer ResumeStudio-test.apk to your Android device, and allow installation from the browser/files app when prompted. A GitHub login may be required for artifact download. Artifacts expire after 14 days.

## Build approach

Capacitor 7.0.1, Node 22, Java 21, SDK 35. The workflow generates the Android project from the pinned Capacitor packages and runs Gradle assembleDebug. Native packaging dependencies are installed in the CI checkout only; package.json and the web lockfile remain unchanged in Git. The APK bundles the web app, not a remote website shell. vite.android.config.ts omits the PWA service worker; normal website builds remain unchanged.

This initial test build supports Android 6.0+ with an updated Android System WebView. It is debug-signed, not ready for Play Store distribution. CI debug certificates are ephemeral, so a later build may require uninstalling the earlier test APK (clears local app data).

## Backend

The build targets rstudio Supabase project aeapocnycabxfckllbsw using its public publishable key. Gemini and Supabase server secrets stay on the backend. Internet is required for sign-in, AI and PDF compilation. Existing users from the old project were not migrated. Test email/password sign-in first; OAuth/magic-link return-to-app behavior needs native deep-link configuration.

## Known device-test limitations

The original PDF UI uses iframes and data-URL download links. Android WebView may not display or download those correctly; native PDF viewing/export is not implemented in this wrapper. Successful backend PDF generation does not verify native preview/download. Browser notifications, install prompts and haptics may behave differently. No emulator or physical-device testing has been performed, and the APK is not built until the workflow succeeds.

Main, the repository default branch, and the hosted frontend are unchanged.
