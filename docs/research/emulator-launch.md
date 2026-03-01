# Emulator Launch Guide

## Prerequisites
- Android Studio installed with Android SDK
- AVD: **Pixel_6** configured
- Node modules installed (`npm install` from project root)

## Quick Start (4 commands)

### 1. Navigate to project
```bash
cd ~/Desktop/SeekerDApp
```

### 2. Start the emulator
```bash
~/Library/Android/sdk/emulator/emulator -avd Pixel_6 &
```
Wait 30-60 seconds for the Android home screen to appear.

### 3. Start Metro bundler
```bash
npx react-native start
```
Leave this running. Don't close the terminal.

### 4. Build and install (new terminal window)
Open a **second terminal** (Cmd + N), then:
```bash
cd ~/Desktop/SeekerDApp && npx react-native run-android
```
First build takes 3-5 minutes. Subsequent builds are faster.

## One-Liner (after emulator is already running)
```bash
cd ~/Desktop/SeekerDApp && npx react-native run-android
```
This starts Metro automatically if it's not running.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Emulator doesn't appear | Open Android Studio > Device Manager > Play button on Pixel_6 |
| "No connected devices" | Emulator isn't ready yet, wait 30 seconds and retry |
| BUILD FAILED | Close terminals, restart from step 1 |
| Red error screen in app | Press **r** in the Metro terminal to reload |
| App installs but won't open | Run `adb devices` to verify emulator is listed, then retry step 4 |
| Metro port already in use | Kill the old process: `lsof -ti:8081 | xargs kill -9` then restart Metro |

## Useful Commands

| Command | What it does |
|---------|--------------|
| `adb devices` | Check if emulator is connected |
| `adb logcat *:E` | View Android error logs |
| `npx react-native start --reset-cache` | Start Metro with fresh cache |
| `cd android && ./gradlew clean && cd ..` | Clean build artifacts (fixes weird build errors) |
