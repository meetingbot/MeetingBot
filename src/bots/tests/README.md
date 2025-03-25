# ✅ Bot Test Checklist (Playwright / Puppeteer)

## 🟡 Startup Tests
- [- ] Bot attempts to connect to S3 on startup.
- [ -] Bot exits if all S3 connection retries fail.
- [ -] Bot exits immediately if given parameters/config are invalid.

---

## 🧭 Navigation Tests
- [ -] Bot uses the correct meeting link from config (via mock config + URL assertions).
- [ -] Ensure the correct type of bot (Meet, Zoom, Teams) is initialized based on config.
- [ -] Bot-generated meeting link matches expected format based on input config.

---

## 🚪 Meeting Join Tests
- [ ] Bot enters its name and profile picture as per config before joining.
- [ ] Bot fails gracefully if platform blocks access (e.g. Google Meet flags it).
- [ ] Bot logs join attempt result (PASS, FAIL).
- [ ] Verify log output confirms expected navigation sequence.

---

## 👋 Meeting Leave Tests
- [ ] Bot leaves meeting if no participant audio is detected within a threshold.
- [ ] Bot leaves meeting if it is the only participant present.
- [ ] Bot leaves if it never gets admitted from a waiting room within timeout.
- [ ] Bot closes page forcefully if it cannot leave cleanly through UI.

---

## 🎥 Recording Tests
- [ ] Bot records screen at expected resolution and layout.
- [ ] Recorded video file is valid (can parse metadata like duration, resolution).
- [ ] Bot uploads recorded video to Amazon S3.
- [ ] Retries upload to S3 multiple times if upload fails.
- [ ] Dummy file test ensures S3 connectivity and upload functionality.

---

## 📡 API Event Tests
- [ ] Bot detects a participant joining and sends corresponding event to backend.
- [ ] Bot detects a participant leaving and sends corresponding event.
- [ ] Bot detects media share start and sends event.
- [ ] Bot detects media share end and sends event.
- [ ] Events are logged and pushed to backend accurately and in real time.
- [ ] Manual test support: spinning up mock meetings to simulate event triggers.

---

## ❤️‍🔥 Heartbeat Tests
- [ ] Bot reads heartbeat interval from config.
- [ ] Bot sends regular heartbeats (ping) to backend on schedule.
- [ ] Heartbeat loop stops if bot exits, crashes, or max runtime is reached (e.g. 10-hour failsafe).