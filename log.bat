@echo off
echo Tailing Android logs for Capacitor...
echo Please reproduce the "failed to fetch" error on your phone now.
E:\AndroidSDK\platform-tools\adb.exe logcat -s Capacitor Capacitor/Console
