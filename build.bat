@echo off
echo ==================================================
echo Bookmark - Auto Build and Android Setup Script
echo ==================================================

echo.
echo [1] Installing npm packages...
:: This installs all the React and Capacitor packages needed for the project
call npm install

echo.
echo [2] Building the React Web App...
:: This converts the React/Vite code into HTML/CSS/JS in the 'dist' folder
call npm run build

echo.
echo [3] Adding Android Platform (If not present)...
:: Since 'android' folder is in .gitignore, this creates a fresh android project
if not exist "android\" (
    call npx cap add android
)

echo.
echo [4] Syncing Capacitor changes to Android...
:: This copies the 'dist' folder and plugins into the Android folder
call npx cap sync android

echo.
echo [5] Injecting Required Android Permissions...
:: We need to add background notification, alarm, and wake lock permissions
:: since the fresh android folder won't have them by default.
powershell -Command "$manifestPath = 'android\app\src\main\AndroidManifest.xml'; $content = Get-Content $manifestPath; if ($content -notmatch 'SCHEDULE_EXACT_ALARM') { $content = $content -replace '</manifest>', \"    <!-- Notifications & Alarms Permissions -->`n    <uses-permission android:name=`\"android.permission.SCHEDULE_EXACT_ALARM`\" />`n    <uses-permission android:name=`\"android.permission.WAKE_LOCK`\" />`n    <uses-permission android:name=`\"android.permission.RECEIVE_BOOT_COMPLETED`\" />`n    <uses-permission android:name=`\"android.permission.VIBRATE`\" />`n    <uses-permission android:name=`\"android.permission.POST_NOTIFICATIONS`\" />`n</manifest>\"; Set-Content $manifestPath $content; Write-Host 'Permissions successfully injected!' -ForegroundColor Green } else { Write-Host 'Permissions already exist in AndroidManifest.xml.' -ForegroundColor Yellow }"

echo.
echo [6] Generating App Icons and Splash Screens...
:: This takes assets/logo.svg and generates all required Android icons
call npx @capacitor/assets generate --android

echo.
echo [7] Building Android APK...
:: This compiles the Android project and generates the APK
cd android
call gradlew.bat assembleDebug
cd ..

echo.
echo [8] Copying APK to root directory...
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "Bookmark.apk"

echo.
echo ==================================================
echo SETUP COMPLETE!
echo Bookmark.apk is now in your project root!
echo You can also run the app on your phone via USB using:
echo npx cap run android
echo ==================================================
pause
