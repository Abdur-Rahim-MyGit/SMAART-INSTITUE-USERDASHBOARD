@echo off
title Backend Live Logs - SMAART User Dashboard
echo ============================================================
echo  Live backend logs - every API request, login, error and
echo  OTP code appears below as it happens (like npm run dev).
echo  Leave this window open while testing. Ctrl+C or close to
echo  stop watching - the server itself is not affected.
echo  (Requires the Docker backend to be running.)
echo ============================================================
docker exec smaart-institue-userdashboard-backend-1 sh -c "tail -n 50 -f /usr/src/app/logs/combined.log"
echo.
echo Log viewer stopped (is the Docker backend running?).
pause
