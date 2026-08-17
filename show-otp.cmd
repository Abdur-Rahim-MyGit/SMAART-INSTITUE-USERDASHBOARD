@echo off
title OTP Codes - SMAART User Dashboard
echo ============================================================
echo  OTP viewer - recent codes are shown first, then every new
echo  login code appears live as it is requested in the app.
echo  Each code is shown with the student email + name it is for.
echo  Codes expire after ~3 minutes - use the newest one.
echo  Leave this window open while testing.
echo  (Requires the Docker backend to be running.)
echo  LOCAL TESTING ONLY - OTP logging is removed before launch.
echo ============================================================
echo --- Recent codes: ---
docker exec smaart-institue-userdashboard-backend-1 sh -c "grep -E 'OTP email to|OTP Code|Name:' /usr/src/app/logs/combined.log | tail -9; echo '--- Waiting for new codes (leave open): ---'; tail -n 0 -f /usr/src/app/logs/combined.log | grep --line-buffered -E 'OTP email to|OTP Code|Name:'"
echo.
echo Viewer stopped (is the Docker backend running?).
pause
